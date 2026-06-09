package assets

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"sort"
	"strings"

	"datagov/backend/internal/platform/idutil"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrAssetNotFound          = errors.New("asset not found")
	ErrBusinessDomainNotFound = errors.New("business domain not found")
	ErrInvalidBusinessDomain  = errors.New("invalid business domain")
)

type Service struct {
	db *pgxpool.Pool
}

type ListQuery struct {
	Keyword string
	Status  string
}

type BusinessDomain struct {
	ID                   string         `json:"id"`
	Code                 string         `json:"code"`
	Name                 string         `json:"name"`
	ParentID             *string        `json:"parentId"`
	Level                int            `json:"level"`
	Status               string         `json:"status"`
	Owner                string         `json:"owner"`
	OwnerUsername        string         `json:"ownerUsername"`
	Org                  string         `json:"org"`
	AssetCount           int            `json:"assetCount"`
	QualityScore         float64        `json:"qualityScore"`
	StandardCoverage     float64        `json:"standardCoverage"`
	SensitiveAssets      int            `json:"sensitiveAssets"`
	DefaultSecurityLevel string         `json:"defaultSecurityLevel"`
	QualityGate          string         `json:"qualityGate"`
	StandardRequired     bool           `json:"standardRequired"`
	ColorClass           string         `json:"colorClass"`
	Growth               string         `json:"growth"`
	UpdatedAt            string         `json:"updatedAt"`
	Description          string         `json:"description"`
	ChildDomains         []string       `json:"childDomains"`
	References           map[string]int `json:"references"`
}

type BusinessDomainRequest struct {
	Code                 string  `json:"code"`
	Name                 string  `json:"name"`
	ParentID             *string `json:"parentId"`
	Status               string  `json:"status"`
	Owner                string  `json:"owner"`
	OwnerUsername        string  `json:"ownerUsername"`
	Org                  string  `json:"org"`
	DefaultSecurityLevel string  `json:"defaultSecurityLevel"`
	QualityGate          string  `json:"qualityGate"`
	StandardRequired     *bool   `json:"standardRequired"`
	Description          string  `json:"description"`
}

type StatusRequest struct {
	Status string `json:"status"`
}

type Asset struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	CnName       string   `json:"cnName"`
	Description  string   `json:"description"`
	Database     string   `json:"database"`
	Source       string   `json:"source"`
	SourceType   string   `json:"sourceType"`
	Layer        string   `json:"layer"`
	Domain       string   `json:"domain"`
	Owner        string   `json:"owner"`
	OwnerAvatar  string   `json:"ownerAvatar"`
	Department   string   `json:"department"`
	Sensitivity  string   `json:"sensitivity"`
	QualityScore float64  `json:"qualityScore"`
	RowCount     int64    `json:"rowCount"`
	Size         string   `json:"size"`
	FieldCount   int      `json:"fieldCount"`
	VisitCount   int      `json:"visitCount"`
	UpdateTime   string   `json:"updateTime"`
	Tags         []string `json:"tags"`
	Certified    bool     `json:"certified"`
	Favorite     bool     `json:"favorite"`
}

type AssetColumn struct {
	Name        string  `json:"name"`
	Type        string  `json:"type"`
	Comment     string  `json:"comment"`
	IsPrimary   bool    `json:"isPrimary"`
	IsSensitive bool    `json:"isSensitive"`
	Standard    string  `json:"standard"`
	Quality     float64 `json:"quality"`
}

type AssetCatalogDetail struct {
	AssetID string         `json:"assetId"`
	Fields  []AssetColumn  `json:"fields"`
	Lineage map[string]any `json:"lineage"`
	Quality map[string]any `json:"quality"`
}

type AssetCatalogQuery struct {
	Keyword       string
	Domains       []string
	Layers        []string
	Sensitivities []string
	Sources       []string
	Tags          []string
	CertifiedOnly bool
	SortField     string
	SortOrder     string
	Page          int
	PageSize      int
	Pagination    bool
}

type AssetCatalogPage struct {
	Items      []Asset `json:"items"`
	Total      int     `json:"total"`
	Page       int     `json:"page"`
	PageSize   int     `json:"pageSize"`
	TotalPages int     `json:"totalPages"`
}

type RegisterAssetRequest struct {
	DataSourceID   string              `json:"dataSourceId"`
	DatabaseID     string              `json:"databaseId"`
	TableIDs       []string            `json:"tableIds"`
	Tables         []map[string]string `json:"tables"`
	AssetName      string              `json:"assetName"`
	BusinessDomain string              `json:"businessDomain"`
	Domain         string              `json:"domain"`
	DataLayer      string              `json:"dataLayer"`
	Owner          string              `json:"owner"`
	Department     string              `json:"department"`
	Description    string              `json:"description"`
	Sensitivity    string              `json:"sensitivity"`
	Tags           []string            `json:"tags"`
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (service *Service) ListBusinessDomains(ctx context.Context, query ListQuery) ([]BusinessDomain, error) {
	status := normalizeDomainStatusFilter(query.Status)
	keyword := strings.ToLower(strings.TrimSpace(query.Keyword))
	rows, err := service.db.Query(ctx, `
		SELECT bd.id, bd.code, bd.name, bd.parent_id, bd.level, bd.status, bd.owner, bd.owner_username,
		       bd.org, COALESCE(asset_stats.asset_count, bd.asset_count), bd.quality_score::float8,
		       bd.standard_coverage::float8, bd.sensitive_assets, bd.default_security_level,
		       bd.quality_gate, bd.standard_required, bd.color_class, bd.growth,
		       to_char(bd.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI'), bd.description,
		       bd.references_json
		FROM business_domains bd
		LEFT JOIN (
			SELECT business_domain_id, count(*)::int AS asset_count
			FROM asset_tables
			WHERE status = 'active'
			GROUP BY business_domain_id
		) asset_stats ON asset_stats.business_domain_id = bd.id
		WHERE ($1 = '' OR bd.status = $1)
			AND ($2 = '' OR lower(bd.name || ' ' || bd.code || ' ' || bd.owner || ' ' || bd.org || ' ' || bd.description) LIKE '%' || $2 || '%')
		ORDER BY bd.level, bd.code
	`, status, keyword)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]BusinessDomain, 0)
	for rows.Next() {
		item, err := scanBusinessDomain(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	attachChildDomainNames(items)
	return items, nil
}

func (service *Service) BusinessDomainOptions(ctx context.Context) ([]map[string]any, error) {
	domains, err := service.ListBusinessDomains(ctx, ListQuery{Status: "active"})
	if err != nil {
		return nil, err
	}
	options := make([]map[string]any, 0, len(domains))
	for _, domain := range domains {
		options = append(options, map[string]any{
			"id":       domain.ID,
			"code":     domain.Code,
			"name":     domain.Name,
			"parentId": domain.ParentID,
			"level":    domain.Level,
		})
	}
	return options, nil
}

func (service *Service) CreateBusinessDomain(ctx context.Context, request BusinessDomainRequest) (BusinessDomain, error) {
	name := strings.TrimSpace(request.Name)
	code := strings.ToUpper(strings.TrimSpace(request.Code))
	if name == "" || code == "" {
		return BusinessDomain{}, ErrInvalidBusinessDomain
	}

	parentID, level, err := service.resolveParentLevel(ctx, request.ParentID)
	if err != nil {
		return BusinessDomain{}, err
	}
	standardRequired := true
	if request.StandardRequired != nil {
		standardRequired = *request.StandardRequired
	}
	status := normalizeDomainStatus(firstNonEmpty(request.Status, "active"))
	id := idutil.New("bd")
	_, err = service.db.Exec(ctx, `
		INSERT INTO business_domains (
			id, code, name, parent_id, level, status, owner, owner_username, org,
			default_security_level, quality_gate, standard_required, description, references_json
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, '{}'::jsonb)
	`, id, code, name, nullableString(parentID), level, status, firstNonEmpty(request.Owner, "待分配"),
		request.OwnerUsername, firstNonEmpty(request.Org, "未分配组织"), firstNonEmpty(request.DefaultSecurityLevel, "L2 内部"),
		firstNonEmpty(request.QualityGate, "发布前完成标准映射、质量校验和安全分级确认"),
		standardRequired, firstNonEmpty(request.Description, "业务域说明待补充。"))
	if err != nil {
		return BusinessDomain{}, err
	}
	return service.GetBusinessDomain(ctx, id)
}

func (service *Service) UpdateBusinessDomain(ctx context.Context, id string, request BusinessDomainRequest) (BusinessDomain, error) {
	current, err := service.GetBusinessDomain(ctx, id)
	if err != nil {
		return BusinessDomain{}, err
	}
	parentID, level, err := service.resolveParentLevel(ctx, request.ParentID)
	if err != nil {
		return BusinessDomain{}, err
	}
	if request.ParentID == nil && current.ParentID != nil {
		parentID = *current.ParentID
		level = current.Level
	}
	standardRequired := current.StandardRequired
	if request.StandardRequired != nil {
		standardRequired = *request.StandardRequired
	}
	code := strings.ToUpper(strings.TrimSpace(firstNonEmpty(request.Code, current.Code)))
	name := strings.TrimSpace(firstNonEmpty(request.Name, current.Name))
	status := normalizeDomainStatus(firstNonEmpty(request.Status, current.Status))

	_, err = service.db.Exec(ctx, `
		UPDATE business_domains
		SET code = $2, name = $3, parent_id = $4, level = $5, status = $6,
		    owner = $7, owner_username = $8, org = $9, default_security_level = $10,
		    quality_gate = $11, standard_required = $12, description = $13, updated_at = now()
		WHERE id = $1
	`, id, code, name, nullableString(parentID), level, status, firstNonEmpty(request.Owner, current.Owner),
		firstNonEmpty(request.OwnerUsername, current.OwnerUsername), firstNonEmpty(request.Org, current.Org),
		firstNonEmpty(request.DefaultSecurityLevel, current.DefaultSecurityLevel), firstNonEmpty(request.QualityGate, current.QualityGate),
		standardRequired, firstNonEmpty(request.Description, current.Description))
	if err != nil {
		return BusinessDomain{}, err
	}
	return service.GetBusinessDomain(ctx, id)
}

func (service *Service) UpdateBusinessDomainStatus(ctx context.Context, id string, status string) (BusinessDomain, error) {
	status = normalizeDomainStatus(status)
	tag, err := service.db.Exec(ctx, `UPDATE business_domains SET status = $2, updated_at = now() WHERE id = $1`, id, status)
	if err != nil {
		return BusinessDomain{}, err
	}
	if tag.RowsAffected() == 0 {
		return BusinessDomain{}, ErrBusinessDomainNotFound
	}
	return service.GetBusinessDomain(ctx, id)
}

func (service *Service) GetBusinessDomain(ctx context.Context, id string) (BusinessDomain, error) {
	row := service.db.QueryRow(ctx, `
		SELECT bd.id, bd.code, bd.name, bd.parent_id, bd.level, bd.status, bd.owner, bd.owner_username,
		       bd.org, COALESCE(asset_stats.asset_count, bd.asset_count), bd.quality_score::float8,
		       bd.standard_coverage::float8, bd.sensitive_assets, bd.default_security_level,
		       bd.quality_gate, bd.standard_required, bd.color_class, bd.growth,
		       to_char(bd.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI'), bd.description,
		       bd.references_json
		FROM business_domains bd
		LEFT JOIN (
			SELECT business_domain_id, count(*)::int AS asset_count
			FROM asset_tables
			WHERE status = 'active'
			GROUP BY business_domain_id
		) asset_stats ON asset_stats.business_domain_id = bd.id
		WHERE bd.id = $1
	`, id)
	item, err := scanBusinessDomain(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return BusinessDomain{}, ErrBusinessDomainNotFound
	}
	return item, err
}

func (service *Service) AssetCoreMetrics(ctx context.Context) ([]map[string]any, error) {
	var totalAssets, dataSources, certified int
	var storageBytes int64
	err := service.db.QueryRow(ctx, `
		SELECT count(*)::int,
		       COALESCE(sum(size_bytes), 0)::bigint,
		       count(DISTINCT source_name)::int,
		       count(*) FILTER (WHERE certified)::int
		FROM asset_tables
		WHERE status = 'active'
	`).Scan(&totalAssets, &storageBytes, &dataSources, &certified)
	if err != nil {
		return nil, err
	}
	coverage := 0.0
	if totalAssets > 0 {
		coverage = float64(certified) / float64(totalAssets) * 100
	}
	return []map[string]any{
		{"label": "数据资产总数", "value": formatInt(totalAssets), "unit": "", "change": "+本期样例", "changeRate": "+0.00%", "trend": "up", "iconType": "database", "gradient": "from-cyan-500 to-blue-600", "bgGradient": "from-cyan-500/10 to-blue-600/10"},
		{"label": "数据存储总量", "value": fmt.Sprintf("%.1f", float64(storageBytes)/1024/1024/1024), "unit": "GB", "change": "真实快照", "changeRate": "+0.00%", "trend": "up", "iconType": "server", "gradient": "from-purple-500 to-pink-600", "bgGradient": "from-purple-500/10 to-pink-600/10"},
		{"label": "已接入数据源", "value": formatInt(dataSources), "unit": "", "change": "资产快照", "changeRate": "+0.00%", "trend": "up", "iconType": "link", "gradient": "from-emerald-500 to-teal-600", "bgGradient": "from-emerald-500/10 to-teal-600/10"},
		{"label": "资产覆盖", "value": fmt.Sprintf("%.1f", coverage), "unit": "%", "change": "已认证口径", "changeRate": "+0.00%", "trend": "up", "iconType": "shield", "gradient": "from-amber-500 to-orange-600", "bgGradient": "from-amber-500/10 to-orange-600/10"},
	}, nil
}

func (service *Service) AssetLayerDistribution(ctx context.Context) ([]map[string]any, error) {
	rows, err := service.db.Query(ctx, `
		SELECT layer, count(*)::int
		FROM asset_tables
		WHERE status = 'active'
		GROUP BY layer
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	counts := map[string]int{}
	total := 0
	for rows.Next() {
		var layer string
		var count int
		if err := rows.Scan(&layer, &count); err != nil {
			return nil, err
		}
		layer = strings.ToUpper(layer)
		counts[layer] = count
		total += count
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	result := make([]map[string]any, 0, len(layerOrder))
	for _, layer := range layerOrder {
		count := counts[layer]
		percent := 0.0
		if total > 0 {
			percent = math.Round(float64(count)*1000/float64(total)) / 10
		}
		result = append(result, map[string]any{
			"name":      layer,
			"label":     layerLabel(layer),
			"count":     count,
			"percent":   percent,
			"color":     layerGradient(layer),
			"textColor": layerTextColor(layer),
		})
	}
	return result, nil
}

func (service *Service) AssetBusinessDomainSummary(ctx context.Context) ([]map[string]any, error) {
	domains, err := service.ListBusinessDomains(ctx, ListQuery{Status: "active"})
	if err != nil {
		return nil, err
	}
	total := 0
	for _, domain := range domains {
		total += domain.AssetCount
	}
	if total == 0 {
		total = 1
	}
	result := make([]map[string]any, 0, len(domains))
	for _, domain := range domains {
		result = append(result, map[string]any{
			"name":    domain.Name,
			"count":   domain.AssetCount,
			"percent": math.Round(float64(domain.AssetCount)*1000/float64(total)) / 10,
			"growth":  domain.Growth,
			"color":   colorClassToGradient(domain.ColorClass),
		})
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i]["count"].(int) > result[j]["count"].(int)
	})
	return result, nil
}

func (service *Service) AssetDataSources(ctx context.Context) ([]map[string]any, error) {
	rows, err := service.db.Query(ctx, `
		SELECT source_name, source_type, count(*)::int, COALESCE(sum(field_count), 0)::int, min(quality_score)::float8
		FROM asset_tables
		WHERE status = 'active'
		GROUP BY source_name, source_type
		ORDER BY source_name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]map[string]any, 0)
	for rows.Next() {
		var name, sourceType string
		var count, fields int
		var minQuality float64
		if err := rows.Scan(&name, &sourceType, &count, &fields, &minQuality); err != nil {
			return nil, err
		}
		status := "healthy"
		if minQuality < 90 {
			status = "warning"
		}
		result = append(result, map[string]any{
			"name":   name,
			"type":   sourceTypeLabel(sourceType),
			"count":  1,
			"tables": count,
			"fields": fields,
			"status": status,
			"icon":   sourceIcon(sourceType),
			"color":  sourceGradient(sourceType),
		})
	}
	return result, rows.Err()
}

func (service *Service) AssetGrowthTrend(ctx context.Context) ([]map[string]any, error) {
	var total int
	if err := service.db.QueryRow(ctx, `SELECT count(*)::int FROM asset_tables WHERE status = 'active'`).Scan(&total); err != nil {
		return nil, err
	}
	months := []string{"1", "2", "3", "4", "5", "6"}
	result := make([]map[string]any, 0, len(months))
	base := maxInt(total-5, 1)
	for index, month := range months {
		value := base + index
		if index == len(months)-1 {
			value = total
		}
		result = append(result, map[string]any{"month": month, "value": value})
	}
	return result, nil
}

func (service *Service) AssetHealthMetrics(ctx context.Context) ([]map[string]any, error) {
	var avgQuality, ownerCoverage, certifiedCoverage, sensitiveCoverage float64
	err := service.db.QueryRow(ctx, `
		SELECT COALESCE(avg(quality_score), 0)::float8,
		       COALESCE((count(*) FILTER (WHERE owner <> ''))::float8 / NULLIF(count(*), 0) * 100, 0),
		       COALESCE((count(*) FILTER (WHERE certified))::float8 / NULLIF(count(*), 0) * 100, 0),
		       COALESCE((count(*) FILTER (WHERE sensitivity <> ''))::float8 / NULLIF(count(*), 0) * 100, 0)
		FROM asset_tables
		WHERE status = 'active'
	`).Scan(&avgQuality, &ownerCoverage, &certifiedCoverage, &sensitiveCoverage)
	if err != nil {
		return nil, err
	}
	return []map[string]any{
		{"label": "元数据完整度", "value": round1(avgQuality), "color": "cyan"},
		{"label": "负责人覆盖率", "value": round1(ownerCoverage), "color": "emerald"},
		{"label": "数据标准符合", "value": round1(certifiedCoverage), "color": "purple"},
		{"label": "安全分级完成", "value": round1(sensitiveCoverage), "color": "rose"},
	}, nil
}

func (service *Service) AssetHotAssets(ctx context.Context) ([]map[string]any, error) {
	rows, err := service.db.Query(ctx, `
		SELECT name, layer, domain_name, visit_count, owner
		FROM asset_tables
		WHERE status = 'active'
		ORDER BY visit_count DESC, updated_at DESC
		LIMIT 8
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]map[string]any, 0)
	rank := 1
	for rows.Next() {
		var name, layer, domain, owner string
		var visits int
		if err := rows.Scan(&name, &layer, &domain, &visits, &owner); err != nil {
			return nil, err
		}
		result = append(result, map[string]any{
			"rank":   rank,
			"name":   name,
			"layer":  layer,
			"domain": domain,
			"visits": visits,
			"owner":  owner,
		})
		rank++
	}
	return result, rows.Err()
}

func (service *Service) AssetPendingItems(ctx context.Context) ([]map[string]any, error) {
	var uncertified, missingOwner, weakQuality, sensitive int
	err := service.db.QueryRow(ctx, `
		SELECT (count(*) FILTER (WHERE NOT certified))::int,
		       (count(*) FILTER (WHERE owner = ''))::int,
		       (count(*) FILTER (WHERE quality_score < 90))::int,
		       (count(*) FILTER (WHERE sensitivity IN ('敏感', '机密')))::int
		FROM asset_tables
		WHERE status = 'active'
	`).Scan(&uncertified, &missingOwner, &weakQuality, &sensitive)
	if err != nil {
		return nil, err
	}
	return []map[string]any{
		{"type": "待审", "count": uncertified, "color": "amber", "icon": "📋"},
		{"type": "待认", "count": sensitive, "color": "cyan", "icon": "🔐"},
		{"type": "待补充元数据", "count": weakQuality, "color": "rose", "icon": "📝"},
		{"type": "待分配负责人", "count": missingOwner, "color": "purple", "icon": "👤"},
	}, nil
}

func (service *Service) ListAssetCatalog(ctx context.Context) ([]Asset, error) {
	page, err := service.ListAssetCatalogPage(ctx, AssetCatalogQuery{})
	if err != nil {
		return nil, err
	}
	return page.Items, nil
}

func (service *Service) ListAssetCatalogPage(ctx context.Context, query AssetCatalogQuery) (AssetCatalogPage, error) {
	rows, err := service.db.Query(ctx, assetSelectSQL()+`
		WHERE status = 'active'
		ORDER BY updated_at DESC, visit_count DESC
	`)
	if err != nil {
		return AssetCatalogPage{}, err
	}
	defer rows.Close()
	items := make([]Asset, 0)
	for rows.Next() {
		item, err := scanAsset(rows)
		if err != nil {
			return AssetCatalogPage{}, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return AssetCatalogPage{}, err
	}

	items = filterAssetCatalog(items, query)
	sortAssetCatalog(items, query.SortField, query.SortOrder)
	total := len(items)
	pageSize := query.PageSize
	if pageSize <= 0 {
		pageSize = total
	}
	if pageSize <= 0 {
		pageSize = 1
	}
	if pageSize > 100 {
		pageSize = 100
	}
	page := query.Page
	if page <= 0 {
		page = 1
	}
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	if totalPages == 0 {
		totalPages = 1
	}
	if page > totalPages {
		page = totalPages
	}
	start := (page - 1) * pageSize
	if start > total {
		start = total
	}
	end := minInt(start+pageSize, total)
	return AssetCatalogPage{
		Items:      items[start:end],
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (service *Service) AssetCatalogDetail(ctx context.Context, id string) (AssetCatalogDetail, error) {
	asset, err := service.findAsset(ctx, id)
	if err != nil {
		return AssetCatalogDetail{}, err
	}
	columns, err := service.assetColumns(ctx, asset.ID)
	if err != nil {
		return AssetCatalogDetail{}, err
	}
	upstream, downstream, err := service.assetLineageSummary(ctx, asset.ID)
	if err != nil {
		return AssetCatalogDetail{}, err
	}
	issueCount := 0
	status := "通过"
	if asset.QualityScore < 95 {
		issueCount = 1
		status = "关注"
	}
	if asset.QualityScore < 90 {
		issueCount = 3
		status = "待治理"
	}
	return AssetCatalogDetail{
		AssetID: asset.ID,
		Fields:  columns,
		Lineage: map[string]any{"upstream": upstream, "downstream": downstream},
		Quality: map[string]any{
			"status":        status,
			"lastCheckTime": asset.UpdateTime,
			"ruleCount":     maxInt(4, asset.FieldCount/4),
			"issueCount":    issueCount,
			"checks": []map[string]any{
				{"name": "完整性", "score": round1(asset.QualityScore), "status": status},
				{"name": "唯一性", "score": round1(math.Min(100, asset.QualityScore+1)), "status": status},
			},
		},
	}, nil
}

func (service *Service) AssetRegisterOptions(ctx context.Context) (map[string]any, error) {
	assets, err := service.ListAssetCatalog(ctx)
	if err != nil {
		return nil, err
	}
	domainOptions, err := service.BusinessDomainOptions(ctx)
	if err != nil {
		return nil, err
	}
	sourceMap := map[string]map[string]any{}
	databaseMap := map[string]map[string]any{}
	tables := make([]map[string]any, 0, len(assets))
	tagSet := map[string]bool{}
	for _, asset := range assets {
		sourceID := slugID(asset.Source)
		if _, ok := sourceMap[sourceID]; !ok {
			sourceMap[sourceID] = map[string]any{
				"id":        sourceID,
				"name":      asset.Source,
				"type":      sourceTypeLabel(asset.SourceType),
				"icon":      sourceIcon(asset.SourceType),
				"status":    "online",
				"host":      "由 Connector Gateway 管理",
				"databases": 0,
				"tables":    0,
			}
		}
		sourceMap[sourceID]["tables"] = sourceMap[sourceID]["tables"].(int) + 1
		databaseID := slugID(asset.Source + "-" + asset.Database)
		if _, ok := databaseMap[databaseID]; !ok {
			databaseMap[databaseID] = map[string]any{
				"id":           databaseID,
				"dataSourceId": sourceID,
				"name":         asset.Database,
				"tableCount":   0,
				"size":         asset.Size,
				"lastSync":     asset.UpdateTime,
			}
			sourceMap[sourceID]["databases"] = sourceMap[sourceID]["databases"].(int) + 1
		}
		databaseMap[databaseID]["tableCount"] = databaseMap[databaseID]["tableCount"].(int) + 1
		tables = append(tables, map[string]any{
			"id":           asset.ID,
			"dataSourceId": sourceID,
			"name":         asset.Name,
			"database":     asset.Database,
			"rowCount":     asset.RowCount,
			"size":         asset.Size,
			"lastUpdate":   asset.UpdateTime,
			"selected":     false,
		})
		for _, tag := range asset.Tags {
			tagSet[tag] = true
		}
	}
	dataSources := mapValuesSorted(sourceMap)
	databases := mapValuesSorted(databaseMap)
	tags := make([]string, 0, len(tagSet)+4)
	for tag := range tagSet {
		tags = append(tags, tag)
	}
	for _, tag := range []string{"核心资产", "高价值", "高频访问", "敏感数据", "待治理", "已认证"} {
		if !tagSet[tag] {
			tags = append(tags, tag)
		}
	}
	sort.Strings(tags)
	domainNames := make([]string, 0, len(domainOptions))
	for _, option := range domainOptions {
		if name, ok := option["name"].(string); ok {
			domainNames = append(domainNames, name)
		}
	}
	return map[string]any{
		"dataSources":     dataSources,
		"databases":       databases,
		"tables":          tables,
		"businessDomains": domainNames,
		"dataLayers": []map[string]any{
			{"value": "ods", "label": "ODS 贴源", "color": "from-blue-500 to-blue-600"},
			{"value": "dwd", "label": "DWD 明细", "color": "from-cyan-500 to-cyan-600"},
			{"value": "dws", "label": "DWS 汇总层", "color": "from-green-500 to-green-600"},
			{"value": "ads", "label": "ADS 应用", "color": "from-purple-500 to-purple-600"},
			{"value": "dim", "label": "DIM 维度", "color": "from-orange-500 to-orange-600"},
		},
		"availableTags": tags,
	}, nil
}

func (service *Service) RegisterAssets(ctx context.Context, request RegisterAssetRequest) ([]Asset, error) {
	ids := request.TableIDs
	if len(ids) == 0 {
		for _, table := range request.Tables {
			if id := strings.TrimSpace(table["id"]); id != "" {
				ids = append(ids, id)
			}
		}
	}
	if len(ids) == 0 {
		return []Asset{}, nil
	}
	domainName := firstNonEmpty(request.BusinessDomain, request.Domain, "公共域")
	domainID, err := service.findBusinessDomainIDByName(ctx, domainName)
	if err != nil {
		return nil, err
	}
	layer := strings.ToUpper(firstNonEmpty(request.DataLayer, "dwd"))
	sensitivity := normalizeSensitivity(request.Sensitivity)
	updated := make([]Asset, 0, len(ids))
	for index, id := range ids {
		asset, err := service.findAsset(ctx, id)
		if err != nil {
			return nil, err
		}
		cnName := asset.CnName
		if strings.TrimSpace(request.AssetName) != "" && len(ids) == 1 {
			cnName = strings.TrimSpace(request.AssetName)
		}
		description := firstNonEmpty(request.Description, asset.Description, asset.Name+" 通过资产注册流程纳入目录。")
		tags := mergeTags(asset.Tags, request.Tags, []string{"新注册"})
		_, err = service.db.Exec(ctx, `
			UPDATE asset_tables
			SET cn_name = $2, description = $3, layer = $4, business_domain_id = $5, domain_name = $6,
			    owner = $7, department = $8, sensitivity = $9, tags = $10, certified = false, updated_at = now()
			WHERE id = $1
		`, asset.ID, cnName, description, layer, domainID, domainName, firstNonEmpty(request.Owner, asset.Owner),
			firstNonEmpty(request.Department, asset.Department), sensitivity, string(mustJSON(tags)))
		if err != nil {
			return nil, err
		}
		next, err := service.findAsset(ctx, asset.ID)
		if err != nil {
			return nil, err
		}
		next.Favorite = index == 0 && next.Favorite
		updated = append(updated, next)
	}
	return updated, nil
}

func (service *Service) Lineage(ctx context.Context, center string) (map[string]any, error) {
	assets, err := service.ListAssetCatalog(ctx)
	if err != nil {
		return nil, err
	}
	if len(assets) == 0 {
		return map[string]any{"center": "", "nodes": []any{}, "edges": []any{}, "fields": []any{}}, nil
	}
	assetByID := map[string]Asset{}
	center = strings.TrimSpace(center)
	centerID := ""
	for _, asset := range assets {
		assetByID[asset.ID] = asset
		if centerID == "" && (strings.EqualFold(asset.ID, center) || strings.EqualFold(asset.Name, center)) {
			centerID = asset.ID
		}
	}
	if centerID == "" {
		for _, asset := range assets {
			if asset.Name == "dwd_order_detail" {
				centerID = asset.ID
				break
			}
		}
	}
	if centerID == "" {
		centerID = assets[0].ID
	}

	edges, err := service.lineageEdges(ctx)
	if err != nil {
		return nil, err
	}
	levels := map[string]int{centerID: 0}
	for i := 0; i < 8; i++ {
		changed := false
		for _, edge := range edges {
			if level, ok := levels[edge.To]; ok {
				if _, exists := levels[edge.From]; !exists {
					levels[edge.From] = level - 1
					changed = true
				}
			}
			if level, ok := levels[edge.From]; ok {
				if _, exists := levels[edge.To]; !exists {
					levels[edge.To] = level + 1
					changed = true
				}
			}
		}
		if !changed {
			break
		}
	}
	nodes := make([]map[string]any, 0, len(levels))
	for assetID, level := range levels {
		asset, ok := assetByID[assetID]
		if !ok || level < -2 || level > 2 {
			continue
		}
		nodes = append(nodes, map[string]any{
			"id":           asset.Name,
			"name":         asset.Name,
			"cnName":       asset.CnName,
			"layer":        asset.Layer,
			"domain":       asset.Domain,
			"owner":        asset.Owner,
			"rows":         formatRows(asset.RowCount),
			"qualityScore": asset.QualityScore,
			"updateTime":   asset.UpdateTime,
			"level":        level,
		})
	}
	sort.Slice(nodes, func(i, j int) bool {
		left, right := nodes[i]["level"].(int), nodes[j]["level"].(int)
		if left == right {
			return nodes[i]["name"].(string) < nodes[j]["name"].(string)
		}
		return left < right
	})
	apiEdges := make([]map[string]any, 0, len(edges))
	for _, edge := range edges {
		from, fromOK := assetByID[edge.From]
		to, toOK := assetByID[edge.To]
		if !fromOK || !toOK {
			continue
		}
		if _, ok := levels[edge.From]; !ok {
			continue
		}
		if _, ok := levels[edge.To]; !ok {
			continue
		}
		apiEdges = append(apiEdges, map[string]any{"from": from.Name, "to": to.Name, "type": edge.Type, "fields": edge.Fields})
	}
	fields, err := service.lineageFields(ctx, centerID)
	if err != nil {
		return nil, err
	}
	centerAsset := assetByID[centerID]
	return map[string]any{"center": centerAsset.Name, "nodes": nodes, "edges": apiEdges, "fields": fields}, nil
}

func (service *Service) MapData(ctx context.Context) (map[string]any, error) {
	assets, err := service.ListAssetCatalog(ctx)
	if err != nil {
		return nil, err
	}
	domains, err := service.ListBusinessDomains(ctx, ListQuery{Status: "active"})
	if err != nil {
		return nil, err
	}
	domainIDByName := map[string]string{}
	apiDomains := make([]map[string]any, 0, len(domains))
	for _, domain := range domains {
		id := strings.ToLower(domain.Code)
		domainIDByName[domain.Name] = id
		apiDomains = append(apiDomains, map[string]any{
			"id":         id,
			"name":       domain.Name,
			"color":      domainHexColor(domain.ColorClass),
			"assetCount": domain.AssetCount,
			"hotCount":   maxInt(1, domain.AssetCount/2),
		})
	}
	layerCounts := map[string]int{}
	apiAssets := make([]map[string]any, 0, len(assets))
	for _, asset := range assets {
		layerCounts[asset.Layer]++
		apiAssets = append(apiAssets, map[string]any{
			"id":           asset.ID,
			"name":         asset.Name,
			"cnName":       asset.CnName,
			"domain":       firstNonEmpty(domainIDByName[asset.Domain], "other"),
			"layer":        asset.Layer,
			"rowCount":     asset.RowCount,
			"qualityScore": asset.QualityScore,
			"hot":          asset.VisitCount >= 8000,
		})
	}
	apiLayers := make([]map[string]any, 0, len(layerOrder))
	for _, layer := range layerOrder {
		apiLayers = append(apiLayers, map[string]any{"id": layer, "name": layer, "color": layerHexColor(layer), "count": layerCounts[layer]})
	}
	return map[string]any{
		"domains": apiDomains,
		"layers":  apiLayers,
		"assets":  apiAssets,
		"datacenters": []map[string]any{
			{"id": "dc-primary", "name": "华东数据中心", "label": "主", "assets": len(assets), "status": "healthy"},
			{"id": "dc-backup", "name": "华北灾备中心", "label": "备", "assets": maxInt(1, len(assets)/3), "status": "healthy"},
		},
	}, nil
}

func scanBusinessDomain(scanner interface {
	Scan(dest ...any) error
}) (BusinessDomain, error) {
	var item BusinessDomain
	var parent sql.NullString
	var referencesRaw []byte
	if err := scanner.Scan(&item.ID, &item.Code, &item.Name, &parent, &item.Level, &item.Status, &item.Owner,
		&item.OwnerUsername, &item.Org, &item.AssetCount, &item.QualityScore, &item.StandardCoverage,
		&item.SensitiveAssets, &item.DefaultSecurityLevel, &item.QualityGate, &item.StandardRequired,
		&item.ColorClass, &item.Growth, &item.UpdatedAt, &item.Description, &referencesRaw); err != nil {
		return BusinessDomain{}, err
	}
	if parent.Valid {
		item.ParentID = &parent.String
	}
	item.References = parseIntMap(referencesRaw)
	item.ChildDomains = []string{}
	return item, nil
}

func filterAssetCatalog(items []Asset, query AssetCatalogQuery) []Asset {
	keyword := strings.ToLower(strings.TrimSpace(query.Keyword))
	domains := normalizeSet(query.Domains)
	layers := normalizeSet(query.Layers)
	sensitivities := normalizeSet(query.Sensitivities)
	sources := normalizeSet(query.Sources)
	tags := normalizeSet(query.Tags)
	result := make([]Asset, 0, len(items))
	for _, item := range items {
		if keyword != "" {
			text := strings.ToLower(strings.Join([]string{
				item.ID,
				item.Name,
				item.CnName,
				item.Description,
				item.Database,
				item.Source,
				item.SourceType,
				item.Domain,
				item.Owner,
				item.Department,
				strings.Join(item.Tags, " "),
			}, " "))
			if !strings.Contains(text, keyword) {
				continue
			}
		}
		if len(domains) > 0 && !domains[strings.ToLower(item.Domain)] {
			continue
		}
		if len(layers) > 0 && !layers[strings.ToLower(item.Layer)] {
			continue
		}
		if len(sensitivities) > 0 && !sensitivities[strings.ToLower(item.Sensitivity)] {
			continue
		}
		if len(sources) > 0 &&
			!sources[strings.ToLower(item.Source)] &&
			!sources[strings.ToLower(item.SourceType)] &&
			!sources[strings.ToLower(sourceTypeLabel(item.SourceType))] {
			continue
		}
		if len(tags) > 0 {
			matched := false
			for _, tag := range item.Tags {
				if tags[strings.ToLower(tag)] {
					matched = true
					break
				}
			}
			if !matched {
				continue
			}
		}
		if query.CertifiedOnly && !item.Certified {
			continue
		}
		result = append(result, item)
	}
	return result
}

func sortAssetCatalog(items []Asset, sortField string, sortOrder string) {
	sortField = strings.TrimSpace(sortField)
	sortOrder = strings.ToLower(strings.TrimSpace(sortOrder))
	desc := sortOrder != "asc"
	sort.SliceStable(items, func(i, j int) bool {
		left, right := items[i], items[j]
		cmp := 0
		switch sortField {
		case "name":
			cmp = strings.Compare(left.Name, right.Name)
		case "visitCount":
			cmp = left.VisitCount - right.VisitCount
		case "qualityScore":
			if left.QualityScore < right.QualityScore {
				cmp = -1
			} else if left.QualityScore > right.QualityScore {
				cmp = 1
			}
		default:
			cmp = strings.Compare(left.UpdateTime, right.UpdateTime)
		}
		if cmp == 0 {
			cmp = strings.Compare(left.Name, right.Name)
		}
		if desc {
			return cmp > 0
		}
		return cmp < 0
	})
}

func normalizeSet(values []string) map[string]bool {
	result := map[string]bool{}
	for _, value := range values {
		for _, part := range strings.Split(value, ",") {
			part = strings.ToLower(strings.TrimSpace(part))
			if part != "" && part != "all" {
				result[part] = true
			}
		}
	}
	return result
}

func scanAsset(scanner interface {
	Scan(dest ...any) error
}) (Asset, error) {
	var item Asset
	var tagsRaw []byte
	if err := scanner.Scan(&item.ID, &item.Name, &item.CnName, &item.Description, &item.Database, &item.Source,
		&item.SourceType, &item.Layer, &item.Domain, &item.Owner, &item.OwnerAvatar, &item.Department,
		&item.Sensitivity, &item.QualityScore, &item.RowCount, &item.Size, &item.FieldCount,
		&item.VisitCount, &item.UpdateTime, &tagsRaw, &item.Certified, &item.Favorite); err != nil {
		return Asset{}, err
	}
	item.Tags = parseStringSlice(tagsRaw)
	return item, nil
}

func (service *Service) findAsset(ctx context.Context, idOrName string) (Asset, error) {
	row := service.db.QueryRow(ctx, assetSelectSQL()+`
		WHERE status = 'active' AND (id = $1 OR name = $1)
		LIMIT 1
	`, idOrName)
	item, err := scanAsset(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return Asset{}, ErrAssetNotFound
	}
	return item, err
}

func (service *Service) assetColumns(ctx context.Context, assetID string) ([]AssetColumn, error) {
	rows, err := service.db.Query(ctx, `
		SELECT name, data_type, comment, is_primary, is_sensitive, standard_code, quality_score::float8
		FROM asset_columns
		WHERE asset_id = $1
		ORDER BY ordinal_position, name
	`, assetID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]AssetColumn, 0)
	for rows.Next() {
		var item AssetColumn
		if err := rows.Scan(&item.Name, &item.Type, &item.Comment, &item.IsPrimary, &item.IsSensitive, &item.Standard, &item.Quality); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(items) > 0 {
		return items, nil
	}
	return []AssetColumn{
		{Name: "id", Type: "bigint", Comment: "主键 ID", IsPrimary: true, Quality: 95},
		{Name: "dt", Type: "date", Comment: "业务日期", Quality: 95},
		{Name: "updated_at", Type: "timestamp", Comment: "更新时间", Quality: 95},
	}, nil
}

func (service *Service) assetLineageSummary(ctx context.Context, assetID string) ([]map[string]any, []map[string]any, error) {
	rows, err := service.db.Query(ctx, `
		SELECT src.name, src.cn_name, e.edge_type, e.field_count, 'upstream' AS direction
		FROM lineage_edges e
		JOIN asset_tables src ON src.id = e.source_asset_id
		WHERE e.target_asset_id = $1
		UNION ALL
		SELECT dst.name, dst.cn_name, e.edge_type, e.field_count, 'downstream' AS direction
		FROM lineage_edges e
		JOIN asset_tables dst ON dst.id = e.target_asset_id
		WHERE e.source_asset_id = $1
	`, assetID)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()
	upstream := make([]map[string]any, 0)
	downstream := make([]map[string]any, 0)
	for rows.Next() {
		var name, cnName, edgeType, direction string
		var fields int
		if err := rows.Scan(&name, &cnName, &edgeType, &fields, &direction); err != nil {
			return nil, nil, err
		}
		item := map[string]any{"name": name, "cnName": cnName, "type": edgeType, "fields": fields}
		if direction == "upstream" {
			upstream = append(upstream, item)
		} else {
			downstream = append(downstream, item)
		}
	}
	return upstream, downstream, rows.Err()
}

type lineageEdge struct {
	From   string
	To     string
	Type   string
	Fields int
}

func (service *Service) lineageEdges(ctx context.Context) ([]lineageEdge, error) {
	rows, err := service.db.Query(ctx, `SELECT source_asset_id, target_asset_id, edge_type, field_count FROM lineage_edges`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]lineageEdge, 0)
	for rows.Next() {
		var item lineageEdge
		if err := rows.Scan(&item.From, &item.To, &item.Type, &item.Fields); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (service *Service) lineageFields(ctx context.Context, assetID string) ([]map[string]any, error) {
	columns, err := service.assetColumns(ctx, assetID)
	if err != nil {
		return nil, err
	}
	items := make([]map[string]any, 0, minInt(len(columns), 5))
	for _, column := range columns {
		items = append(items, map[string]any{
			"from":   "upstream." + column.Name,
			"to":     "current." + column.Name,
			"logic":  firstNonEmpty(column.Comment, "同名字段映射"),
			"status": "normal",
		})
		if len(items) >= 5 {
			break
		}
	}
	return items, nil
}

func (service *Service) resolveParentLevel(ctx context.Context, parentID *string) (string, int, error) {
	if parentID == nil || strings.TrimSpace(*parentID) == "" {
		return "", 1, nil
	}
	var level int
	err := service.db.QueryRow(ctx, `SELECT level FROM business_domains WHERE id = $1`, strings.TrimSpace(*parentID)).Scan(&level)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", 0, ErrBusinessDomainNotFound
	}
	if err != nil {
		return "", 0, err
	}
	return strings.TrimSpace(*parentID), level + 1, nil
}

func (service *Service) findBusinessDomainIDByName(ctx context.Context, name string) (string, error) {
	var id string
	err := service.db.QueryRow(ctx, `SELECT id FROM business_domains WHERE name = $1 AND status <> 'retired' LIMIT 1`, name).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrBusinessDomainNotFound
	}
	return id, err
}

func assetSelectSQL() string {
	return `
		SELECT id, name, cn_name, description, database_name, source_name, source_type, layer,
		       domain_name, owner, owner_avatar, department, sensitivity, quality_score::float8,
		       row_count, size_label, field_count, visit_count,
		       to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI'),
		       tags, certified, favorite
		FROM asset_tables
	`
}

func attachChildDomainNames(items []BusinessDomain) {
	nameByID := map[string]string{}
	for _, item := range items {
		nameByID[item.ID] = item.Name
	}
	for index := range items {
		children := make([]string, 0)
		for _, candidate := range items {
			if candidate.ParentID != nil && *candidate.ParentID == items[index].ID {
				children = append(children, nameByID[candidate.ID])
			}
		}
		sort.Strings(children)
		items[index].ChildDomains = children
	}
}

func parseIntMap(raw []byte) map[string]int {
	if len(raw) == 0 {
		return map[string]int{}
	}
	values := map[string]int{}
	_ = json.Unmarshal(raw, &values)
	return values
}

func parseStringSlice(raw []byte) []string {
	if len(raw) == 0 {
		return []string{}
	}
	values := []string{}
	_ = json.Unmarshal(raw, &values)
	return values
}

func mustJSON(value any) []byte {
	raw, err := json.Marshal(value)
	if err != nil {
		return []byte("null")
	}
	return raw
}

func nullableString(value string) any {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return strings.TrimSpace(value)
}

func normalizeDomainStatusFilter(status string) string {
	status = normalizeDomainStatus(status)
	if status == "all" {
		return ""
	}
	return status
}

func normalizeDomainStatus(status string) string {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "", "all":
		return "all"
	case "active", "paused", "retired":
		return strings.ToLower(strings.TrimSpace(status))
	default:
		return "active"
	}
}

func normalizeSensitivity(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "public", "公开":
		return "公开"
	case "sensitive", "敏感":
		return "敏感"
	case "confidential", "机密":
		return "机密"
	default:
		return "内部"
	}
}

func mergeTags(groups ...[]string) []string {
	seen := map[string]bool{}
	result := make([]string, 0)
	for _, group := range groups {
		for _, tag := range group {
			tag = strings.TrimSpace(tag)
			if tag == "" || seen[tag] {
				continue
			}
			seen[tag] = true
			result = append(result, tag)
		}
	}
	return result
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func formatInt(value int) string {
	text := fmt.Sprintf("%d", value)
	if len(text) <= 3 {
		return text
	}
	var builder strings.Builder
	for index, char := range text {
		if index > 0 && (len(text)-index)%3 == 0 {
			builder.WriteString(",")
		}
		builder.WriteRune(char)
	}
	return builder.String()
}

func formatRows(value int64) string {
	switch {
	case value >= 1_000_000_000:
		return fmt.Sprintf("%.1fB", float64(value)/1_000_000_000)
	case value >= 1_000_000:
		return fmt.Sprintf("%.1fM", float64(value)/1_000_000)
	case value >= 1_000:
		return fmt.Sprintf("%.1fK", float64(value)/1_000)
	default:
		return fmt.Sprintf("%d", value)
	}
}

func round1(value float64) float64 {
	return math.Round(value*10) / 10
}

func minInt(a int, b int) int {
	if a < b {
		return a
	}
	return b
}

func maxInt(a int, b int) int {
	if a > b {
		return a
	}
	return b
}

func slugID(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	replacer := strings.NewReplacer(" ", "-", "_", "-", ".", "-", ":", "-", "/", "-", "\\", "-")
	value = replacer.Replace(value)
	value = strings.Trim(value, "-")
	if value == "" {
		return "unknown"
	}
	return value
}

func mapValuesSorted(values map[string]map[string]any) []map[string]any {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	result := make([]map[string]any, 0, len(keys))
	for _, key := range keys {
		result = append(result, values[key])
	}
	return result
}

var layerOrder = []string{"ODS", "DWD", "DWS", "ADS", "DIM"}

func layerLabel(layer string) string {
	switch strings.ToUpper(layer) {
	case "ODS":
		return "原始数据源"
	case "DWD":
		return "明细数据层"
	case "DWS":
		return "汇总数据层"
	case "ADS":
		return "应用数据层"
	case "DIM":
		return "维度数据层"
	default:
		return "其他数据层"
	}
}

func layerGradient(layer string) string {
	switch strings.ToUpper(layer) {
	case "ODS":
		return "from-blue-500 to-cyan-500"
	case "DWD":
		return "from-purple-500 to-pink-500"
	case "DWS":
		return "from-emerald-500 to-teal-500"
	case "ADS":
		return "from-amber-500 to-orange-500"
	case "DIM":
		return "from-rose-500 to-red-500"
	default:
		return "from-slate-500 to-slate-700"
	}
}

func layerTextColor(layer string) string {
	switch strings.ToUpper(layer) {
	case "ODS":
		return "text-cyan-400"
	case "DWD":
		return "text-purple-400"
	case "DWS":
		return "text-emerald-400"
	case "ADS":
		return "text-amber-400"
	case "DIM":
		return "text-rose-400"
	default:
		return "text-slate-400"
	}
}

func layerHexColor(layer string) string {
	switch strings.ToUpper(layer) {
	case "ODS":
		return "#3b82f6"
	case "DWD":
		return "#06b6d4"
	case "DWS":
		return "#a855f7"
	case "ADS":
		return "#ec4899"
	case "DIM":
		return "#f59e0b"
	default:
		return "#64748b"
	}
}

func colorClassToGradient(value string) string {
	switch value {
	case "bg-purple-500":
		return "bg-gradient-to-r from-purple-500 to-fuchsia-500"
	case "bg-emerald-500":
		return "bg-gradient-to-r from-emerald-500 to-teal-500"
	case "bg-rose-500":
		return "bg-gradient-to-r from-rose-500 to-red-500"
	case "bg-amber-500":
		return "bg-gradient-to-r from-amber-500 to-orange-500"
	case "bg-slate-500":
		return "bg-gradient-to-r from-slate-500 to-slate-400"
	default:
		return "bg-gradient-to-r from-cyan-500 to-blue-500"
	}
}

func domainHexColor(value string) string {
	switch value {
	case "bg-purple-500":
		return "#a855f7"
	case "bg-emerald-500":
		return "#10b981"
	case "bg-rose-500":
		return "#f43f5e"
	case "bg-amber-500":
		return "#f59e0b"
	case "bg-slate-500":
		return "#64748b"
	default:
		return "#06b6d4"
	}
}

func sourceTypeLabel(value string) string {
	switch strings.ToLower(value) {
	case "mysql":
		return "MySQL"
	case "postgresql", "postgres":
		return "PostgreSQL"
	case "clickhouse":
		return "ClickHouse"
	case "kafka":
		return "Kafka"
	case "oracle":
		return "Oracle"
	case "hive":
		return "Hive"
	default:
		if strings.TrimSpace(value) == "" {
			return "Unknown"
		}
		return strings.ToUpper(value[:1]) + strings.ToLower(value[1:])
	}
}

func sourceIcon(value string) string {
	switch strings.ToLower(value) {
	case "mysql":
		return "🐬"
	case "hive":
		return "🐝"
	case "postgresql", "postgres":
		return "🐘"
	case "kafka":
		return "📨"
	case "oracle":
		return "🟥"
	case "clickhouse":
		return ""
	default:
		return "🔗"
	}
}

func sourceGradient(value string) string {
	switch strings.ToLower(value) {
	case "mysql":
		return "from-blue-500 to-cyan-500"
	case "hive":
		return "from-amber-500 to-orange-500"
	case "postgresql", "postgres":
		return "from-indigo-500 to-blue-500"
	case "kafka":
		return "from-slate-500 to-slate-700"
	case "oracle":
		return "from-red-500 to-rose-500"
	case "clickhouse":
		return "from-yellow-500 to-amber-500"
	default:
		return "from-cyan-500 to-blue-500"
	}
}
