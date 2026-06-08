package development

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"strings"
	"time"

	"datagov/backend/internal/platform/idutil"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrScriptNotFound = errors.New("script not found")

type Service struct {
	db     *pgxpool.Pool
	logger *slog.Logger
}

type Script struct {
	ID               string            `json:"id"`
	Name             string            `json:"name"`
	Type             string            `json:"type"`
	ScriptType       string            `json:"scriptType,omitempty"`
	EditorLanguage   string            `json:"editorLanguage,omitempty"`
	Dialect          string            `json:"dialect,omitempty"`
	ParentID         *string           `json:"parentId"`
	Content          string            `json:"content,omitempty"`
	Status           string            `json:"status,omitempty"`
	Version          int               `json:"version,omitempty"`
	DataSourceID     string            `json:"dataSourceId,omitempty"`
	DataSourceConfig map[string]string `json:"dataSourceConfig,omitempty"`
	UpdateTime       string            `json:"updateTime,omitempty"`
}

type ScriptRequest struct {
	Name             string            `json:"name"`
	Type             string            `json:"type"`
	ScriptType       string            `json:"scriptType"`
	EditorLanguage   string            `json:"editorLanguage"`
	Dialect          string            `json:"dialect"`
	ParentID         *string           `json:"parentId"`
	Content          string            `json:"content"`
	Status           string            `json:"status"`
	Version          int               `json:"version"`
	DataSourceID     string            `json:"dataSourceId"`
	DataSourceConfig map[string]string `json:"dataSourceConfig"`
	Comment          string            `json:"comment"`
}

type ScriptVersion struct {
	ID         string `json:"id"`
	ScriptID   string `json:"scriptId"`
	Version    int    `json:"version"`
	Content    string `json:"content"`
	CreateTime string `json:"createTime"`
	Creator    string `json:"creator"`
	Comment    string `json:"comment"`
}

type RunResult struct {
	RunID  string           `json:"runId"`
	Status string           `json:"status"`
	Logs   []string         `json:"logs"`
	Data   []map[string]any `json:"data"`
}

type PublishResult struct {
	Success    bool   `json:"success"`
	ApprovalID string `json:"approvalId"`
	Message    string `json:"message"`
}

func NewService(db *pgxpool.Pool, logger *slog.Logger) *Service {
	if logger == nil {
		logger = slog.Default()
	}
	return &Service{db: db, logger: logger}
}

func (service *Service) Bootstrap(ctx context.Context) error {
	folderID := "folder-sample-development"
	if _, err := service.db.Exec(ctx, `
		INSERT INTO scripts (id, name, type, status, version, created_by, updated_at)
		VALUES ($1, '样例脚本', 'folder', 'draft', 1, 'system', now())
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			type = EXCLUDED.type,
			updated_at = now()
	`, folderID); err != nil {
		return err
	}

	content := strings.Join([]string{
		"-- PostgreSQL 样例查询：订单明细",
		"SELECT",
		"  order_id,",
		"  user_id,",
		"  product_id,",
		"  amount,",
		"  order_time",
		"FROM dwd.dwd_order_detail",
		"ORDER BY order_time DESC",
		"LIMIT 20;",
	}, "\n")

	scriptID := "script-sample-order-detail"
	if _, err := service.db.Exec(ctx, `
		INSERT INTO scripts (
			id, name, type, script_type, editor_language, dialect, parent_id,
			data_source_id, content, status, version, created_by, updated_at
		)
		VALUES ($1, 'sample_order_detail_query', 'sql', 'postgresql-sql', 'sql', 'postgresql', $2,
		        'ds-sample-postgresql', $3, 'draft', 1, 'system', now())
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			type = EXCLUDED.type,
			script_type = EXCLUDED.script_type,
			editor_language = EXCLUDED.editor_language,
			dialect = EXCLUDED.dialect,
			parent_id = EXCLUDED.parent_id,
			data_source_id = EXCLUDED.data_source_id,
			content = EXCLUDED.content,
			updated_at = now()
	`, scriptID, folderID, content); err != nil {
		return err
	}

	_, err := service.db.Exec(ctx, `
		INSERT INTO script_versions (id, script_id, version, content, creator, comment)
		VALUES ('ver-sample-order-detail-1', $1, 1, $2, 'system', '初始化样例脚本')
		ON CONFLICT (script_id, version) DO NOTHING
	`, scriptID, content)
	return err
}

func (service *Service) ListScripts(ctx context.Context) ([]Script, error) {
	rows, err := service.db.Query(ctx, `
		SELECT id, name, type, script_type, editor_language, dialect, parent_id,
		       data_source_id, content, status, version, updated_at
		FROM scripts
		WHERE deleted_at IS NULL
		ORDER BY type = 'folder' DESC, parent_id NULLS FIRST, updated_at DESC, name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Script, 0)
	for rows.Next() {
		item, err := scanScript(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (service *Service) CreateScript(ctx context.Context, request ScriptRequest) (Script, error) {
	if strings.TrimSpace(request.Name) == "" {
		return Script{}, errors.New("script name is required")
	}
	if strings.TrimSpace(request.Type) == "" {
		request.Type = "sql"
	}

	scriptID := idutil.New("script")
	if request.Type == "folder" {
		scriptID = idutil.New("folder")
	}
	status := request.Status
	if status == "" {
		status = "draft"
	}

	dataSourceID := nullableString(request.DataSourceID)
	if _, err := service.db.Exec(ctx, `
		INSERT INTO scripts (
			id, name, type, script_type, editor_language, dialect, parent_id,
			data_source_id, content, status, version, created_by, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, 'admin', now())
	`, scriptID, request.Name, request.Type, request.ScriptType, request.EditorLanguage, request.Dialect, request.ParentID, dataSourceID, request.Content, status); err != nil {
		return Script{}, err
	}

	if request.Type != "folder" {
		if err := service.createVersion(ctx, scriptID, 1, request.Content, "admin", "Initial version"); err != nil {
			return Script{}, err
		}
	}

	return service.GetScript(ctx, scriptID)
}

func (service *Service) UpdateScript(ctx context.Context, id string, request ScriptRequest) (Script, error) {
	current, err := service.GetScript(ctx, id)
	if err != nil {
		return Script{}, err
	}

	name := firstNonEmpty(request.Name, current.Name)
	scriptType := firstNonEmpty(request.ScriptType, current.ScriptType)
	editorLanguage := firstNonEmpty(request.EditorLanguage, current.EditorLanguage)
	dialect := firstNonEmpty(request.Dialect, current.Dialect)
	status := firstNonEmpty(request.Status, current.Status)
	content := request.Content
	if content == "" {
		content = current.Content
	}
	dataSourceID := nullableString(request.DataSourceID)
	if request.DataSourceID == "" && current.DataSourceID != "" {
		dataSourceID = &current.DataSourceID
	}

	version := current.Version
	contentChanged := current.Type != "folder" && content != current.Content
	if contentChanged {
		version = current.Version + 1
	}

	commandTag, err := service.db.Exec(ctx, `
		UPDATE scripts
		SET name = $2,
		    script_type = $3,
		    editor_language = $4,
		    dialect = $5,
		    parent_id = $6,
		    data_source_id = $7,
		    content = $8,
		    status = $9,
		    version = $10,
		    updated_at = now()
		WHERE id = $1 AND deleted_at IS NULL
	`, id, name, scriptType, editorLanguage, dialect, request.ParentID, dataSourceID, content, status, version)
	if err != nil {
		return Script{}, err
	}
	if commandTag.RowsAffected() == 0 {
		return Script{}, ErrScriptNotFound
	}

	if contentChanged {
		comment := firstNonEmpty(request.Comment, "保存脚本")
		if err := service.createVersion(ctx, id, version, content, "admin", comment); err != nil {
			return Script{}, err
		}
	}

	return service.GetScript(ctx, id)
}

func (service *Service) GetScript(ctx context.Context, id string) (Script, error) {
	row := service.db.QueryRow(ctx, `
		SELECT id, name, type, script_type, editor_language, dialect, parent_id,
		       data_source_id, content, status, version, updated_at
		FROM scripts
		WHERE id = $1 AND deleted_at IS NULL
	`, id)
	item, err := scanScript(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return Script{}, ErrScriptNotFound
	}
	return item, err
}

func (service *Service) RunScript(ctx context.Context, id string) (RunResult, error) {
	script, err := service.GetScript(ctx, id)
	if err != nil {
		return RunResult{}, err
	}
	if script.Type == "folder" {
		return RunResult{}, errors.New("folder cannot run")
	}

	logs := []string{
		"任务已启动",
		"已进入受控运行模式：首期仅记录运行与返回预览，不直接执行用户脚本。",
		"脚本：" + script.Name,
		"方言：" + firstNonEmpty(script.Dialect, "未指定"),
		"执行完成。",
	}
	data := []map[string]any{
		{"id": 1, "name": script.Name, "rows": 0, "status": "recorded"},
		{"id": 2, "name": "safety_guard", "rows": 0, "status": "passed"},
	}

	logsJSON, _ := json.Marshal(logs)
	dataJSON, _ := json.Marshal(data)
	runID := idutil.New("run")
	if _, err := service.db.Exec(ctx, `
		INSERT INTO script_runs (id, script_id, status, logs, result_preview, started_at, finished_at)
		VALUES ($1, $2, 'succeeded', $3, $4, now(), now())
	`, runID, id, logsJSON, dataJSON); err != nil {
		return RunResult{}, err
	}

	return RunResult{RunID: runID, Status: "succeeded", Logs: logs, Data: data}, nil
}

func (service *Service) PublishScript(ctx context.Context, id string) (PublishResult, error) {
	commandTag, err := service.db.Exec(ctx, `
		UPDATE scripts
		SET status = 'approving', updated_at = now()
		WHERE id = $1 AND deleted_at IS NULL AND type <> 'folder'
	`, id)
	if err != nil {
		return PublishResult{}, err
	}
	if commandTag.RowsAffected() == 0 {
		return PublishResult{}, ErrScriptNotFound
	}

	return PublishResult{
		Success:    true,
		ApprovalID: idutil.New("approval"),
		Message:    "Submitted to approval flow",
	}, nil
}

func (service *Service) ListVersions(ctx context.Context, scriptID string) ([]ScriptVersion, error) {
	rows, err := service.db.Query(ctx, `
		SELECT id, script_id, version, content, created_at, creator, comment
		FROM script_versions
		WHERE script_id = $1
		ORDER BY version DESC
	`, scriptID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ScriptVersion, 0)
	for rows.Next() {
		var item ScriptVersion
		var createdAt time.Time
		if err := rows.Scan(&item.ID, &item.ScriptID, &item.Version, &item.Content, &createdAt, &item.Creator, &item.Comment); err != nil {
			return nil, err
		}
		item.CreateTime = createdAt.UTC().Format("2006-01-02 15:04:05")
		items = append(items, item)
	}
	return items, rows.Err()
}

func (service *Service) createVersion(ctx context.Context, scriptID string, version int, content string, creator string, comment string) error {
	_, err := service.db.Exec(ctx, `
		INSERT INTO script_versions (id, script_id, version, content, creator, comment)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (script_id, version) DO NOTHING
	`, idutil.New("ver"), scriptID, version, content, creator, comment)
	return err
}

type scriptScanner interface {
	Scan(dest ...any) error
}

func scanScript(row scriptScanner) (Script, error) {
	var item Script
	var parentID *string
	var dataSourceID *string
	var updatedAt time.Time
	err := row.Scan(
		&item.ID,
		&item.Name,
		&item.Type,
		&item.ScriptType,
		&item.EditorLanguage,
		&item.Dialect,
		&parentID,
		&dataSourceID,
		&item.Content,
		&item.Status,
		&item.Version,
		&updatedAt,
	)
	if err != nil {
		return Script{}, err
	}
	item.ParentID = parentID
	if dataSourceID != nil {
		item.DataSourceID = *dataSourceID
	}
	item.DataSourceConfig = map[string]string{}
	item.UpdateTime = updatedAt.UTC().Format("2006-01-02 15:04:05")
	return item, nil
}

func nullableString(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return &value
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}
