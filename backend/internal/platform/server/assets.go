package server

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"datagov/backend/internal/modules/assets"
	"datagov/backend/internal/platform/httpx"
)

func (server *Server) handleListBusinessDomains(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "assets:domains:read"); !ok {
		return
	}
	items, err := server.assets.ListBusinessDomains(r.Context(), assets.ListQuery{
		Keyword: r.URL.Query().Get("keyword"),
		Status:  r.URL.Query().Get("status"),
	})
	if err != nil {
		server.writeAssetsError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleBusinessDomainOptions(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "assets:domains:read"); !ok {
		return
	}
	items, err := server.assets.BusinessDomainOptions(r.Context())
	if err != nil {
		server.writeAssetsError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleCreateBusinessDomain(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "assets:domains:write"); !ok {
		return
	}
	var request assets.BusinessDomainRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid business domain request")
		return
	}
	item, err := server.assets.CreateBusinessDomain(r.Context(), request)
	if err != nil {
		server.writeAssetsError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) handleUpdateBusinessDomain(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "assets:domains:write"); !ok {
		return
	}
	var request assets.BusinessDomainRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid business domain request")
		return
	}
	item, err := server.assets.UpdateBusinessDomain(r.Context(), r.PathValue("id"), request)
	if err != nil {
		server.writeAssetsError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) handleUpdateBusinessDomainStatus(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "assets:domains:write"); !ok {
		return
	}
	var request assets.StatusRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid business domain status request")
		return
	}
	item, err := server.assets.UpdateBusinessDomainStatus(r.Context(), r.PathValue("id"), request.Status)
	if err != nil {
		server.writeAssetsError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) handleAssetCoreMetrics(w http.ResponseWriter, r *http.Request) {
	server.writeAssetRead(w, r, server.assets.AssetCoreMetrics)
}

func (server *Server) handleAssetLayerDistribution(w http.ResponseWriter, r *http.Request) {
	server.writeAssetRead(w, r, server.assets.AssetLayerDistribution)
}

func (server *Server) handleAssetBusinessDomains(w http.ResponseWriter, r *http.Request) {
	server.writeAssetRead(w, r, server.assets.AssetBusinessDomainSummary)
}

func (server *Server) handleAssetDataSources(w http.ResponseWriter, r *http.Request) {
	server.writeAssetRead(w, r, server.assets.AssetDataSources)
}

func (server *Server) handleAssetGrowthTrend(w http.ResponseWriter, r *http.Request) {
	server.writeAssetRead(w, r, server.assets.AssetGrowthTrend)
}

func (server *Server) handleAssetHealthMetrics(w http.ResponseWriter, r *http.Request) {
	server.writeAssetRead(w, r, server.assets.AssetHealthMetrics)
}

func (server *Server) handleAssetHotAssets(w http.ResponseWriter, r *http.Request) {
	server.writeAssetRead(w, r, server.assets.AssetHotAssets)
}

func (server *Server) handleAssetPendingItems(w http.ResponseWriter, r *http.Request) {
	server.writeAssetRead(w, r, server.assets.AssetPendingItems)
}

func (server *Server) handleAssetCatalog(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "assets:catalog:read"); !ok {
		return
	}
	query := parseAssetCatalogQuery(r)
	if !query.Pagination {
		items, err := server.assets.ListAssetCatalog(r.Context())
		if err != nil {
			server.writeAssetsError(w, err)
			return
		}
		httpx.Success(w, items)
		return
	}
	page, err := server.assets.ListAssetCatalogPage(r.Context(), query)
	if err != nil {
		server.writeAssetsError(w, err)
		return
	}
	httpx.Success(w, page)
}

func (server *Server) handleAssetCatalogDetail(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "assets:catalog:read"); !ok {
		return
	}
	item, err := server.assets.AssetCatalogDetail(r.Context(), r.PathValue("id"))
	if err != nil {
		server.writeAssetsError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) handleAssetRegisterOptions(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "assets:catalog:read"); !ok {
		return
	}
	item, err := server.assets.AssetRegisterOptions(r.Context())
	if err != nil {
		server.writeAssetsError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) handleRegisterAssets(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "assets:catalog:write"); !ok {
		return
	}
	var request assets.RegisterAssetRequest
	if err := httpx.DecodeJSON(r, &request); err != nil {
		httpx.Error(w, http.StatusBadRequest, 400, "invalid asset register request")
		return
	}
	items, err := server.assets.RegisterAssets(r.Context(), request)
	if err != nil {
		server.writeAssetsError(w, err)
		return
	}
	httpx.Success(w, items)
}

func (server *Server) handleAssetLineage(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "metadata:lineage:read"); !ok {
		return
	}
	item, err := server.assets.Lineage(r.Context(), r.URL.Query().Get("center"))
	if err != nil {
		server.writeAssetsError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) handleAssetMap(w http.ResponseWriter, r *http.Request) {
	if _, ok := server.requirePermission(w, r, "assets:catalog:read"); !ok {
		return
	}
	item, err := server.assets.MapData(r.Context())
	if err != nil {
		server.writeAssetsError(w, err)
		return
	}
	httpx.Success(w, item)
}

func (server *Server) writeAssetRead(w http.ResponseWriter, r *http.Request, load func(context.Context) ([]map[string]any, error)) {
	if _, ok := server.requirePermission(w, r, "assets:catalog:read"); !ok {
		return
	}
	items, err := load(r.Context())
	if err != nil {
		server.writeAssetsError(w, err)
		return
	}
	httpx.Success(w, items)
}

func parseAssetCatalogQuery(r *http.Request) assets.AssetCatalogQuery {
	values := r.URL.Query()
	page, _ := strconv.Atoi(values.Get("page"))
	pageSize, _ := strconv.Atoi(values.Get("pageSize"))
	pagination := values.Has("page") || values.Has("pageSize")
	return assets.AssetCatalogQuery{
		Keyword:       values.Get("keyword"),
		Domains:       splitQueryValues(values["domain"], values["domains"]),
		Layers:        splitQueryValues(values["layer"], values["layers"]),
		Sensitivities: splitQueryValues(values["sensitivity"], values["sensitivities"]),
		Sources:       splitQueryValues(values["source"], values["sources"]),
		Tags:          splitQueryValues(values["tag"], values["tags"]),
		CertifiedOnly: values.Get("certified") == "true",
		SortField:     values.Get("sortField"),
		SortOrder:     values.Get("sortOrder"),
		Page:          page,
		PageSize:      pageSize,
		Pagination:    pagination,
	}
}

func splitQueryValues(groups ...[]string) []string {
	items := make([]string, 0)
	for _, group := range groups {
		for _, value := range group {
			for _, part := range strings.Split(value, ",") {
				part = strings.TrimSpace(part)
				if part != "" {
					items = append(items, part)
				}
			}
		}
	}
	return items
}

func (server *Server) writeAssetsError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, assets.ErrAssetNotFound):
		httpx.Error(w, http.StatusNotFound, 404, "资产不存在")
	case errors.Is(err, assets.ErrBusinessDomainNotFound):
		httpx.Error(w, http.StatusNotFound, 404, "业务域不存在")
	case errors.Is(err, assets.ErrInvalidBusinessDomain):
		httpx.Error(w, http.StatusBadRequest, 400, "业务域参数无效")
	default:
		server.deps.Logger.Error("assets request failed", "error", err)
		httpx.Error(w, http.StatusInternalServerError, 500, "资产服务异常")
	}
}
