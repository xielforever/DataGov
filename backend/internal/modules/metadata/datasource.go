package metadata

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/url"
	"strconv"
	"strings"
	"time"

	"datagov/backend/internal/platform/config"
	"datagov/backend/internal/platform/idutil"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrDataSourceNotFound = errors.New("data source not found")

type Service struct {
	db     *pgxpool.Pool
	cfg    config.SampleDataSourceConfig
	logger *slog.Logger
}

type DataSource struct {
	ID                   string   `json:"id"`
	Name                 string   `json:"name"`
	Type                 string   `json:"type"`
	Category             string   `json:"category"`
	Status               string   `json:"status"`
	Host                 string   `json:"host"`
	Port                 int      `json:"port"`
	Database             string   `json:"database"`
	Version              string   `json:"version"`
	Owner                string   `json:"owner"`
	Department           string   `json:"department"`
	Env                  string   `json:"env"`
	TableCount           int      `json:"tableCount"`
	StorageGB            float64  `json:"storageGB"`
	QPS                  float64  `json:"qps"`
	LatencyMs            int      `json:"latencyMs"`
	Latency              int      `json:"latency"`
	LastSyncTime         string   `json:"lastSyncTime"`
	LastSync             string   `json:"lastSync"`
	CreateTime           string   `json:"createTime"`
	Description          string   `json:"description"`
	Tags                 []string `json:"tags"`
	CredentialConfigured bool     `json:"credentialConfigured"`
}

type CreateDataSourceRequest struct {
	Name        string   `json:"name"`
	Type        string   `json:"type"`
	Host        string   `json:"host"`
	Port        int      `json:"port"`
	Database    string   `json:"database"`
	Username    string   `json:"username"`
	Password    string   `json:"password"`
	Env         string   `json:"env"`
	Owner       string   `json:"owner"`
	Department  string   `json:"department"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
}

type StatusRequest struct {
	Status string `json:"status"`
}

type ConnectionTestResult struct {
	Status    string         `json:"status"`
	LatencyMs int64          `json:"latencyMs"`
	Message   string         `json:"message"`
	CheckedAt string         `json:"checkedAt"`
	Sample    map[string]any `json:"sample"`
}

type SyncRun struct {
	ID           string `json:"id"`
	DataSourceID string `json:"dataSourceId"`
	Status       string `json:"status"`
	StartedAt    string `json:"startedAt"`
	Message      string `json:"message"`
}

type dataSourceCredential struct {
	Username string
	Password string
}

func NewService(db *pgxpool.Pool, cfg config.SampleDataSourceConfig, logger *slog.Logger) *Service {
	if logger == nil {
		logger = slog.Default()
	}
	return &Service{db: db, cfg: cfg, logger: logger}
}

func (service *Service) Bootstrap(ctx context.Context) error {
	if strings.TrimSpace(service.cfg.DatabaseURL) == "" {
		return nil
	}

	parsed, err := url.Parse(service.cfg.DatabaseURL)
	if err != nil {
		return err
	}

	port := 5432
	if parsed.Port() != "" {
		if parsedPort, err := strconv.Atoi(parsed.Port()); err == nil {
			port = parsedPort
		}
	}

	database := strings.TrimPrefix(parsed.Path, "/")
	username := parsed.User.Username()
	password, _ := parsed.User.Password()
	tags := []string{"样例数据源", "PostgreSQL", "首期联调"}

	_, err = service.upsertDataSource(ctx, "ds-sample-postgresql", CreateDataSourceRequest{
		Name:        "datagov_sample_postgresql",
		Type:        "PostgreSQL",
		Host:        parsed.Hostname(),
		Port:        port,
		Database:    database,
		Username:    username,
		Password:    password,
		Env:         "测试",
		Owner:       "系统管理员",
		Department:  "平台管理部",
		Description: "首期后端联调用 PostgreSQL 样例数据源，包含 raw、dim、dwd 等样例 schema。",
		Tags:        tags,
	}, "online")
	return err
}

func (service *Service) ListDataSources(ctx context.Context) ([]DataSource, error) {
	rows, err := service.db.Query(ctx, `
		SELECT ds.id, ds.name, ds.type, ds.category, ds.status, ds.host, ds.port, ds.database_name,
		       ds.version, ds.owner, ds.department, ds.env, ds.table_count, ds.storage_gb,
		       ds.qps, ds.latency_ms, ds.last_sync_time, ds.created_at, ds.description, ds.tags,
		       dsc.data_source_id IS NOT NULL AS credential_configured
		FROM data_sources ds
		LEFT JOIN data_source_credentials dsc ON dsc.data_source_id = ds.id
		WHERE ds.deleted_at IS NULL
		ORDER BY ds.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]DataSource, 0)
	for rows.Next() {
		item, err := scanDataSource(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (service *Service) CreateDataSource(ctx context.Context, request CreateDataSourceRequest) (DataSource, error) {
	if request.Name == "" || request.Type == "" || request.Host == "" || request.Port == 0 {
		return DataSource{}, errors.New("name, type, host and port are required")
	}
	return service.upsertDataSource(ctx, idutil.New("ds"), request, "offline")
}

func (service *Service) UpdateStatus(ctx context.Context, id string, status string) (DataSource, error) {
	commandTag, err := service.db.Exec(ctx, `
		UPDATE data_sources
		SET status = $2, updated_at = now()
		WHERE id = $1 AND deleted_at IS NULL
	`, id, status)
	if err != nil {
		return DataSource{}, err
	}
	if commandTag.RowsAffected() == 0 {
		return DataSource{}, ErrDataSourceNotFound
	}
	return service.GetDataSource(ctx, id)
}

func (service *Service) SyncDataSource(ctx context.Context, id string) (SyncRun, error) {
	if _, err := service.GetDataSource(ctx, id); err != nil {
		return SyncRun{}, err
	}

	runID := idutil.New("sync")
	startedAt := time.Now().UTC()
	message := "元数据同步任务已创建，等待执行面接管"
	if _, err := service.db.Exec(ctx, `
		INSERT INTO metadata_sync_runs (id, data_source_id, status, message, started_at)
		VALUES ($1, $2, 'queued', $3, $4)
	`, runID, id, message, startedAt); err != nil {
		return SyncRun{}, err
	}

	if _, err := service.db.Exec(ctx, `
		UPDATE data_sources
		SET status = 'syncing', last_sync_time = $2, updated_at = now()
		WHERE id = $1
	`, id, startedAt); err != nil {
		return SyncRun{}, err
	}

	return SyncRun{
		ID:           runID,
		DataSourceID: id,
		Status:       "queued",
		StartedAt:    startedAt.Format(time.RFC3339),
		Message:      message,
	}, nil
}

func (service *Service) TestConnection(ctx context.Context, id string) (ConnectionTestResult, error) {
	item, err := service.GetDataSource(ctx, id)
	if err != nil {
		return ConnectionTestResult{}, err
	}

	credential, err := service.getCredential(ctx, id)
	if err != nil {
		return ConnectionTestResult{}, err
	}

	startedAt := time.Now()
	checkedAt := time.Now().UTC()
	result := ConnectionTestResult{
		Status:    "failed",
		LatencyMs: 0,
		Message:   "暂不支持该类型连接测试",
		CheckedAt: checkedAt.Format(time.RFC3339),
		Sample:    map[string]any{},
	}

	if item.Type == "PostgreSQL" {
		result = service.testPostgres(ctx, item, credential)
	}

	status := "warning"
	if result.Status == "success" {
		status = "online"
	}
	latency := int(time.Since(startedAt).Milliseconds())
	sampleJSON, _ := json.Marshal(result.Sample)

	_, _ = service.db.Exec(ctx, `
		INSERT INTO connector_health_checks (id, data_source_id, status, latency_ms, message, sample, checked_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, idutil.New("check"), id, result.Status, latency, result.Message, sampleJSON, checkedAt)

	_, _ = service.db.Exec(ctx, `
		UPDATE data_sources
		SET status = $2, latency_ms = $3, updated_at = now()
		WHERE id = $1
	`, id, status, latency)

	result.LatencyMs = int64(latency)
	return result, nil
}

func (service *Service) GetDataSource(ctx context.Context, id string) (DataSource, error) {
	row := service.db.QueryRow(ctx, `
		SELECT ds.id, ds.name, ds.type, ds.category, ds.status, ds.host, ds.port, ds.database_name,
		       ds.version, ds.owner, ds.department, ds.env, ds.table_count, ds.storage_gb,
		       ds.qps, ds.latency_ms, ds.last_sync_time, ds.created_at, ds.description, ds.tags,
		       dsc.data_source_id IS NOT NULL AS credential_configured
		FROM data_sources ds
		LEFT JOIN data_source_credentials dsc ON dsc.data_source_id = ds.id
		WHERE ds.id = $1 AND ds.deleted_at IS NULL
	`, id)
	item, err := scanDataSource(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return DataSource{}, ErrDataSourceNotFound
	}
	return item, err
}

func (service *Service) upsertDataSource(ctx context.Context, id string, request CreateDataSourceRequest, status string) (DataSource, error) {
	tags := request.Tags
	if len(tags) == 0 {
		tags = []string{request.Type}
	}
	tagsJSON, _ := json.Marshal(tags)
	category := categoryByType(request.Type)
	env := request.Env
	if env == "" {
		env = "开发"
	}
	owner := request.Owner
	if owner == "" {
		owner = "待分配"
	}
	department := request.Department
	if department == "" {
		department = "未分配组织"
	}

	tx, err := service.db.Begin(ctx)
	if err != nil {
		return DataSource{}, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	if _, err = tx.Exec(ctx, `
		INSERT INTO data_sources (
			id, name, type, category, status, host, port, database_name, version, owner,
			department, env, description, tags, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '待检测', $9, $10, $11, $12, $13, now())
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			type = EXCLUDED.type,
			category = EXCLUDED.category,
			status = EXCLUDED.status,
			host = EXCLUDED.host,
			port = EXCLUDED.port,
			database_name = EXCLUDED.database_name,
			owner = EXCLUDED.owner,
			department = EXCLUDED.department,
			env = EXCLUDED.env,
			description = EXCLUDED.description,
			tags = EXCLUDED.tags,
			updated_at = now()
	`, id, request.Name, request.Type, category, status, request.Host, request.Port, request.Database, owner, department, env, request.Description, tagsJSON); err != nil {
		return DataSource{}, err
	}

	if request.Username != "" || request.Password != "" {
		if _, err = tx.Exec(ctx, `
			INSERT INTO data_source_credentials (data_source_id, username, password_ciphertext, updated_at)
			VALUES ($1, $2, $3, now())
			ON CONFLICT (data_source_id) DO UPDATE SET
				username = EXCLUDED.username,
				password_ciphertext = EXCLUDED.password_ciphertext,
				secret_version = data_source_credentials.secret_version + 1,
				updated_at = now()
		`, id, request.Username, request.Password); err != nil {
			return DataSource{}, err
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return DataSource{}, err
	}
	return service.GetDataSource(ctx, id)
}

func (service *Service) getCredential(ctx context.Context, id string) (dataSourceCredential, error) {
	var credential dataSourceCredential
	err := service.db.QueryRow(ctx, `
		SELECT username, password_ciphertext
		FROM data_source_credentials
		WHERE data_source_id = $1
	`, id).Scan(&credential.Username, &credential.Password)
	if errors.Is(err, pgx.ErrNoRows) {
		return dataSourceCredential{}, errors.New("data source credential is not configured")
	}
	return credential, err
}

func (service *Service) testPostgres(ctx context.Context, item DataSource, credential dataSourceCredential) ConnectionTestResult {
	startedAt := time.Now()
	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=disable",
		url.QueryEscape(credential.Username),
		url.QueryEscape(credential.Password),
		item.Host,
		item.Port,
		item.Database,
	)
	poolConfig, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return failedConnectionResult(startedAt, err)
	}
	poolConfig.ConnConfig.ConnectTimeout = 5 * time.Second
	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return failedConnectionResult(startedAt, err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		return failedConnectionResult(startedAt, err)
	}

	schemas := make([]string, 0)
	rows, err := pool.Query(ctx, `
		SELECT schema_name
		FROM information_schema.schemata
		WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
		  AND schema_name NOT LIKE 'pg_toast%'
		ORDER BY schema_name
		LIMIT 20
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var schema string
			if scanErr := rows.Scan(&schema); scanErr == nil {
				schemas = append(schemas, schema)
			}
		}
	}

	var tableCount int
	_ = pool.QueryRow(ctx, `
		SELECT count(*)
		FROM information_schema.tables
		WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
	`).Scan(&tableCount)

	return ConnectionTestResult{
		Status:    "success",
		LatencyMs: time.Since(startedAt).Milliseconds(),
		Message:   "连接成功",
		CheckedAt: time.Now().UTC().Format(time.RFC3339),
		Sample: map[string]any{
			"schemas":    schemas,
			"tableCount": tableCount,
		},
	}
}

func failedConnectionResult(startedAt time.Time, err error) ConnectionTestResult {
	return ConnectionTestResult{
		Status:    "failed",
		LatencyMs: time.Since(startedAt).Milliseconds(),
		Message:   err.Error(),
		CheckedAt: time.Now().UTC().Format(time.RFC3339),
		Sample:    map[string]any{},
	}
}

type dataSourceScanner interface {
	Scan(dest ...any) error
}

func scanDataSource(row dataSourceScanner) (DataSource, error) {
	var item DataSource
	var lastSyncTime *time.Time
	var createdAt time.Time
	var tagsBytes []byte
	err := row.Scan(
		&item.ID,
		&item.Name,
		&item.Type,
		&item.Category,
		&item.Status,
		&item.Host,
		&item.Port,
		&item.Database,
		&item.Version,
		&item.Owner,
		&item.Department,
		&item.Env,
		&item.TableCount,
		&item.StorageGB,
		&item.QPS,
		&item.LatencyMs,
		&lastSyncTime,
		&createdAt,
		&item.Description,
		&tagsBytes,
		&item.CredentialConfigured,
	)
	if err != nil {
		return DataSource{}, err
	}

	if len(tagsBytes) > 0 {
		_ = json.Unmarshal(tagsBytes, &item.Tags)
	}
	if item.Tags == nil {
		item.Tags = []string{}
	}

	item.Latency = item.LatencyMs
	item.CreateTime = createdAt.UTC().Format("2006-01-02 15:04:05")
	if lastSyncTime != nil {
		item.LastSyncTime = lastSyncTime.UTC().Format("2006-01-02 15:04:05")
		item.LastSync = item.LastSyncTime
	}

	return item, nil
}

func categoryByType(dataSourceType string) string {
	switch dataSourceType {
	case "MySQL", "PostgreSQL", "Oracle":
		return "关系型"
	case "Hive":
		return "大数据"
	case "Kafka":
		return "消息队列"
	case "MongoDB", "Redis":
		return "NoSQL"
	case "Elasticsearch":
		return "搜索引擎"
	default:
		return "OLAP"
	}
}
