import { useState, useMemo, useCallback, useEffect } from "react";
import Breadcrumb from '../../components/common/Breadcrumb';
import { fetchBusinessDomainOptions, fetchMetadataModels } from "../../services/api";
import ErrorFallback from "../../components/common/ErrorFallback";
import { CardSkeleton } from "../../components/common/Skeleton";

type Position = { x: number; y: number };
type PositionMap = Record<string, Position>;

interface EntityField {
  name: string;
  type: string;
  comment: string;
  nullable: boolean;
  primaryKey?: boolean;
  foreignKey?: string;
}

interface Entity {
  id: string;
  name: string;
  cnName: string;
  type: "conceptual" | "logical" | "physical";
  domain: string;
  layer: "ODS" | "DWD" | "DWS" | "ADS" | "DIM";
  fields: EntityField[];
  description: string;
  owner: string;
  version: string;
  updatedAt: string;
  x: number;
  y: number;
}

interface Relationship {
  from: string;
  to: string;
  type: "1:1" | "1:N" | "N:1" | "N:M";
  label?: string;
}

interface MetadataModel {
  id: string;
  name: string;
  version: string;
  type: "conceptual" | "logical" | "physical";
  entities: Entity[];
  relationships: Relationship[];
  description: string;
}

const EMPTY_MODEL: MetadataModel = {
  id: "",
  name: "",
  version: "v1.0",
  type: "logical",
  entities: [],
  relationships: [],
  description: "",
};


export default function MetadataModel() {
  const [models, setModels] = useState<MetadataModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<MetadataModel>(EMPTY_MODEL);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modelType, setModelType] = useState<"all" | "conceptual" | "logical" | "physical">("all");
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [positions, setPositions] = useState<PositionMap>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [layoutKey, setLayoutKey] = useState(0); // bump to retrigger animations
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<MetadataModel | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importFormat, setImportFormat] = useState<"json" | "sql" | "pdm">("json");
  // Create model dialog - multi-step
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [newModelName, setNewModelName] = useState("");
  const [newModelType, setNewModelType] = useState<"conceptual" | "logical" | "physical">("logical");
  const [newModelDesc, setNewModelDesc] = useState("");
  const [newModelDomain, setNewModelDomain] = useState("交易域");
  const [businessDomainOptions, setBusinessDomainOptions] = useState<string[]>(["交易域", "用户域", "商品域", "营销域", "财务域", "风控域"]);
  const [newModelOwner, setNewModelOwner] = useState("数据治理团队");
  const [newModelVersion, setNewModelVersion] = useState("v1.0");
  const [newModelTags, setNewModelTags] = useState<string[]>([]);
  const [createMethod, setCreateMethod] = useState<"blank" | "template" | "import" | "copy">("blank");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("ecommerce");
  const [copySourceId, setCopySourceId] = useState<string>("");
  // Staged entities & relations for wizard structure step
  const [stagedEntities, setStagedEntities] = useState<Entity[]>([]);
  const [stagedRelations, setStagedRelations] = useState<Relationship[]>([]);
  const [expandedStagedEntity, setExpandedStagedEntity] = useState<string | null>(null);
  // Canvas add dropdown
  const [showCanvasAddMenu, setShowCanvasAddMenu] = useState(false);
  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<MetadataModel | null>(null);
  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2400);
  };

  // Entity, Field, Relation CRUD States
  const [manageDialog, setManageDialog] = useState<{
    type: "entity" | "field" | "relation";
    mode: "create" | "edit";
    entityId?: string;
    field?: EntityField;
    relation?: Relationship;
    relationIndex?: number; // For staged relations (no id)
    staging?: boolean;       // True when editing wizard staged data
  } | null>(null);

  // States for CRUD forms
  const [formEntity, setFormEntity] = useState<Partial<Entity>>({
    name: "", cnName: "", layer: "DWD", description: "", owner: "数据治理团队", version: "1.0", domain: "交易域"
  });
  const [formField, setFormField] = useState<EntityField>({
    name: "", type: "string", comment: "", nullable: true, primaryKey: false
  });
  const [formRelation, setFormRelation] = useState<Relationship>({
    from: "", to: "", type: "1:N", label: ""
  });

  const defaultBusinessDomain = businessDomainOptions[0] || "交易域";

  useEffect(() => {
    fetchBusinessDomainOptions().then((res) => {
      const names = (res as Array<{ name: string }>).map((domain) => domain.name);
      if (!names.length) return;
      setBusinessDomainOptions(names);
      setNewModelDomain((current) => names.includes(current) ? current : names[0]);
      setFormEntity((current) => ({ ...current, domain: current.domain || names[0] }));
    });
  }, []);


  useEffect(() => {
    fetchMetadataModels().then((data) => {
      const loaded = Array.isArray(data) ? data as MetadataModel[] : [];
      if (loaded.length > 0) {
        setModels(loaded);
        setSelectedModel(loaded[0]);
        if (loaded[0].entities.length > 0) setSelectedEntity(loaded[0].entities[0]);
      }
    }).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);
  const updateModelData = (updatedEntities: Entity[], updatedRels: Relationship[]) => {
    const updated = {
      ...selectedModel,
      entities: updatedEntities,
      relationships: updatedRels,
    };
    setModels(prev => prev.map(m => m.id === selectedModel.id ? updated : m));
    setSelectedModel(updated);
    
    // update selected entity info
    if (selectedEntity) {
      const match = updatedEntities.find(e => e.id === selectedEntity.id);
      setSelectedEntity(match || updatedEntities[0] || null);
    } else if (updatedEntities.length > 0) {
      setSelectedEntity(updatedEntities[0]);
    }
  };

  const handleSaveEntity = () => {
    if (!formEntity.name) { showToast("请输入实体名称", "error"); return; }
    const isStaging = manageDialog?.staging;
    if (manageDialog?.mode === "create") {
      const newEntity: Entity = {
        id: "e_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        name: formEntity.name,
        cnName: formEntity.cnName || formEntity.name,
        type: (formEntity.type as any) || newModelType || "logical",
        domain: formEntity.domain || newModelDomain || defaultBusinessDomain,
        layer: (formEntity.layer as any) || "DWD",
        fields: formEntity.fields || [],
        description: formEntity.description || "",
        owner: formEntity.owner || newModelOwner || "张明",
        version: formEntity.version || newModelVersion?.replace(/^v/, "") || "1.0",
        updatedAt: new Date().toISOString().split('T')[0],
        x: 200 + Math.random() * 80,
        y: 200 + Math.random() * 80
      };
      if (isStaging) {
        setStagedEntities(prev => [...prev, newEntity]);
        showToast(`已添加实体'${newEntity.name}（待创建）`, "success");
      } else {
        const updatedEntities = [...selectedModel.entities, newEntity];
        updateModelData(updatedEntities, selectedModel.relationships);
        showToast(`已成功新建实体'${newEntity.name}`, "success");
      }
    } else if (manageDialog?.mode === "edit" && manageDialog.entityId) {
      if (isStaging) {
        setStagedEntities(prev => prev.map(e => e.id === manageDialog.entityId ? { ...e, ...formEntity } as Entity : e));
        showToast(`实体 ${formEntity.name} 已更新`, "success");
      } else {
        const updatedEntities = selectedModel.entities.map(e => e.id === manageDialog.entityId ? { ...e, ...formEntity } as Entity : e);
        updateModelData(updatedEntities, selectedModel.relationships);
        showToast(`实体 ${formEntity.name} 已保存`, "success");
      }
    }
    setManageDialog(null);
  };

  const handleSaveField = () => {
    if (!formField.name) { showToast("请输入属性名称", "error"); return; }
    if (!manageDialog?.entityId) return;

    const isStaging = manageDialog?.staging;
    const sourceList = isStaging ? stagedEntities : selectedModel.entities;
    const targetEntity = sourceList.find(e => e.id === manageDialog.entityId);
    if (!targetEntity) return;

    let updatedFields = [...targetEntity.fields];
    if (manageDialog.mode === "create") {
      if (updatedFields.some(f => f.name === formField.name)) { showToast("属性名称已存在", "error"); return; }
      updatedFields.push({ ...formField });
      showToast(`已为 ${targetEntity.name} 添加字段 ${formField.name}`, "success");
    } else {
      updatedFields = updatedFields.map(f => f.name === manageDialog.field?.name ? { ...formField } : f);
      showToast(`字段 ${formField.name} 保存成功`, "success");
    }

    if (isStaging) {
      setStagedEntities(prev => prev.map(e => e.id === manageDialog.entityId ? { ...e, fields: updatedFields } : e));
    } else {
      const updatedEntities = selectedModel.entities.map(e => e.id === manageDialog.entityId ? { ...e, fields: updatedFields } : e);
      updateModelData(updatedEntities, selectedModel.relationships);
    }
    setManageDialog(null);
  };

  const handleSaveRelation = () => {
    if (!formRelation.from || !formRelation.to) { showToast("请选择关联实体", "error"); return; }
    if (formRelation.from === formRelation.to) { showToast("关联实体不能相同", "error"); return; }

    const isStaging = manageDialog?.staging;
    if (isStaging) {
      if (manageDialog?.mode === "edit" && manageDialog.relationIndex !== undefined) {
        setStagedRelations(prev => prev.map((r, i) => i === manageDialog.relationIndex ? { ...formRelation } : r));
        showToast(`已更新关系' ${formRelation.label || "关联"}`, "success");
      } else {
        setStagedRelations(prev => [...prev, { ...formRelation }]);
        showToast(`已添加关系' ${formRelation.label || "关联"}（待创建）`, "success");
      }
    } else {
      const updatedRels = [...selectedModel.relationships];
      if (manageDialog?.mode === "edit" && manageDialog.relationIndex !== undefined) {
        updatedRels[manageDialog.relationIndex] = { ...formRelation };
        showToast(`已更新关系' ${formRelation.label || "关联"}`, "success");
      } else {
        updatedRels.push({ ...formRelation });
        showToast(`成功新增连线关系: ${formRelation.label || "关联"}`, "success");
      }
      updateModelData(selectedModel.entities, updatedRels);
    }
    setManageDialog(null);
  };

  const posKey = (modelId: string, entityId: string) => `${modelId}::${entityId}`;

  const getPos = useCallback(
    (entity: Entity): Position => {
      return positions[posKey(selectedModel.id, entity.id)] ?? { x: entity.x, y: entity.y };
    },
    [positions, selectedModel.id]
  );

  // Force-directed auto layout
  const runAutoLayout = useCallback(
    (model: MetadataModel) => {
      const entities = model.entities;
      if (entities.length === 0) return;

      const NODE_W = 180;
      const NODE_H = 160;
      const IDEAL_DIST = 260;
      const W = 760;
      const H = 540;

      // Initialize on a circle / grid
      const cols = Math.ceil(Math.sqrt(entities.length));
      const nodes = entities.map((e, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return {
          id: e.id,
          x: 80 + col * 240 + (Math.random() - 0.5) * 30,
          y: 80 + row * 200 + (Math.random() - 0.5) * 30,
          vx: 0,
          vy: 0,
        };
      });

      const ITER = 400;
      for (let iter = 0; iter < ITER; iter++) {
        const cooling = 1 - iter / ITER;
        // Repulsion between all node pairs
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[j].x - nodes[i].x;
            const dy = nodes[j].y - nodes[i].y;
            const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
            const force = 16000 / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            nodes[i].vx -= fx;
            nodes[i].vy -= fy;
            nodes[j].vx += fx;
            nodes[j].vy += fy;
          }
        }
        // Attraction along relationships
        model.relationships.forEach((rel) => {
          const a = nodes.find((n) => n.id === rel.from);
          const b = nodes.find((n) => n.id === rel.to);
          if (!a || !b) return;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = (dist - IDEAL_DIST) * 0.05;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        });
        // Gentle pull toward center
        nodes.forEach((n) => {
          n.vx += (W / 2 - n.x) * 0.006;
          n.vy += (H / 2 - n.y) * 0.006;
        });
        // Apply velocity with damping
        nodes.forEach((n) => {
          n.x += n.vx * cooling;
          n.y += n.vy * cooling;
          n.vx *= 0.82;
          n.vy *= 0.82;
        });
      }

      // Normalize: shift to leave 40px padding from top-left
      let minX = Infinity;
      let minY = Infinity;
      nodes.forEach((n) => {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
      });
      const offsetX = 40 - minX;
      const offsetY = 40 - minY;

      const next: PositionMap = { ...positions };
      nodes.forEach((n) => {
        next[posKey(model.id, n.id)] = {
          x: Math.round(n.x + offsetX),
          y: Math.round(n.y + offsetY),
        };
      });
      setPositions(next);
      setLayoutKey((k) => k + 1);
      // Suppress unused warning
      void NODE_W;
      void NODE_H;
    },
    [positions]
  );

  const resetLayout = () => {
    const next = { ...positions };
    selectedModel.entities.forEach((e) => {
      delete next[posKey(selectedModel.id, e.id)];
    });
    setPositions(next);
    setLayoutKey((k) => k + 1);
  };

  // Drag handlers for entities
  const handleEntityMouseDown = (e: React.MouseEvent, entity: Entity) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = getPos(entity);
    const scale = zoom / 100;
    setDraggingId(entity.id);
    setSelectedEntity(entity);

    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      setPositions((prev) => ({
        ...prev,
        [posKey(selectedModel.id, entity.id)]: {
          x: Math.max(0, orig.x + dx),
          y: Math.max(0, orig.y + dy),
        },
      }));
    };
    const onUp = () => {
      setDraggingId(null);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // Import model functions
  const parseSQLDDL = (sql: string): MetadataModel => {
    const entities: Entity[] = [];
    const tableRegex = /CREATE\s+TABLE\s+(?:`?(\w+)`?\.)?`?(\w+)`?\s*\(([\s\S]*?)\)\s*(?:ENGINE|DEFAULT|;)/gi;
    let match;
    let idCounter = 1;

    while ((match = tableRegex.exec(sql)) !== null) {
      const tableName = match[2];
      const colsBlock = match[3];
      const fields: EntityField[] = [];
      
      const colLines = colsBlock.split(/,\s*\n/).map(l => l.trim()).filter(l => l && !l.toUpperCase().startsWith('PRIMARY') && !l.toUpperCase().startsWith('KEY') && !l.toUpperCase().startsWith('CONSTRAINT') && !l.toUpperCase().startsWith('INDEX'));
      
      colLines.forEach(line => {
        const colMatch = line.match(/`?(\w+)`?\s+(\w+(?:\(\d+(?:,\d+)?\))?)/i);
        if (colMatch) {
          const [, colName, colType] = colMatch;
          const isPK = line.toUpperCase().includes('PRIMARY KEY') || line.toUpperCase().includes(' AUTO_INCREMENT');
          fields.push({
            name: colName,
            type: colType.toLowerCase().replace(/\(.*\)/, ''),
            comment: colName,
            nullable: !line.toUpperCase().includes('NOT NULL'),
            primaryKey: isPK,
          });
        }
      });

      entities.push({
        id: `e${idCounter++}`,
        name: tableName,
        cnName: tableName,
        type: "physical",
        domain: "导入",
        layer: "ODS",
        fields,
        description: `从SQL导入: ${tableName}`,
        owner: "导入用户",
        version: "1.0",
        updatedAt: new Date().toISOString().split('T')[0],
        x: 100 + (entities.length % 3) * 220,
        y: 100 + Math.floor(entities.length / 3) * 200,
      });
    }

    return {
      id: `m${Date.now()}`,
      name: `导入模型_${new Date().toLocaleTimeString()}`,
      version: "v1.0",
      type: "physical",
      description: `从SQL DDL导入，共${entities.length}张表`,
      entities,
      relationships: [],
    };
  };

  const handleFileSelect = async (file: File) => {
    setImportFile(file);
    setImportError(null);
    setImportPreview(null);

    try {
      const text = await file.text();
      let model: MetadataModel;

      if (importFormat === "json" || file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        // Validate structure
        if (!parsed.name || !Array.isArray(parsed.entities)) {
          throw new Error("JSON格式不正确，缺少name或entities字段");
        }
        model = {
          id: `m${Date.now()}`,
          name: parsed.name,
          version: parsed.version || "v1.0",
          type: parsed.type || "logical",
          description: parsed.description || `'{file.name}导入`,
          entities: (parsed.entities || []).map((e: any, i: number) => ({
            ...e,
            id: e.id || `e${i + 1}`,
            x: e.x || 100 + (i % 3) * 220,
            y: e.y || 100 + Math.floor(i / 3) * 200,
          })),
          relationships: parsed.relationships || [],
        };
      } else if (importFormat === "sql" || file.name.endsWith('.sql')) {
        model = parseSQLDDL(text);
      } else {
        throw new Error("暂不支持该格式");
      }

      setImportPreview(model);
    } catch (err: any) {
      setImportError(err.message || "解析失败");
    }
  };

  const confirmImport = () => {
    if (!importPreview) return;
    
    const newModels = [...models, importPreview];
    setModels(newModels);
    setSelectedModel(importPreview);
    setSelectedEntity(importPreview.entities[0] || null);
    setShowImport(false);
    setImportFile(null);
    setImportPreview(null);
    showToast(`已导入'{importPreview.name}''${importPreview.entities.length} 个实体`);
    // Auto layout after import
    setTimeout(() => runAutoLayout(importPreview), 100);
  };

  // Pre-built templates (extracted so step 4 staging can also use them)
  const buildTemplate = (templateId: string): { entities: Entity[]; relationships: Relationship[] } => {
    const today = new Date().toISOString().split('T')[0];
    const templates: Record<string, { entities: Partial<Entity>[]; relationships: Relationship[] }> = {
      ecommerce: {
        entities: [
          { id: "t1", name: "Order", cnName: "订单", type: newModelType, domain: newModelDomain, layer: "DWD", description: "用户订单", fields: [{ name: "order_id", type: "string", comment: "订单ID", nullable: false, primaryKey: true }, { name: "user_id", type: "string", comment: "用户ID", nullable: false }, { name: "amount", type: "decimal", comment: "金额", nullable: false }], x: 200, y: 120 },
          { id: "t2", name: "User", cnName: "用户", type: newModelType, domain: newModelDomain, layer: "DWD", description: "平台用户", fields: [{ name: "user_id", type: "string", comment: "用户ID", nullable: false, primaryKey: true }, { name: "user_name", type: "string", comment: "用户域", nullable: false }], x: 80, y: 280 },
          { id: "t3", name: "Product", cnName: "商品", type: newModelType, domain: newModelDomain, layer: "DIM", description: "商品主数据", fields: [{ name: "product_id", type: "string", comment: "商品ID", nullable: false, primaryKey: true }, { name: "name", type: "string", comment: "名称", nullable: false }], x: 360, y: 280 },
        ],
        relationships: [
          { from: "t1", to: "t2", type: "N:1", label: "下单" },
          { from: "t1", to: "t3", type: "N:M", label: "包含" },
        ],
      },
      usercenter: {
        entities: [
          { id: "t1", name: "User", cnName: "用户", type: newModelType, domain: newModelDomain, layer: "DWD", description: "用户基础信息", fields: [{ name: "user_id", type: "string", comment: "用户ID", nullable: false, primaryKey: true }], x: 200, y: 100 },
          { id: "t2", name: "UserProfile", cnName: "用户画像", type: newModelType, domain: newModelDomain, layer: "DWS", description: "用户标签画像", fields: [{ name: "user_id", type: "string", comment: "用户ID", nullable: false, primaryKey: true }], x: 200, y: 260 },
        ],
        relationships: [{ from: "t2", to: "t1", type: "1:1", label: "画像" }],
      },
      finance: {
        entities: [
          { id: "t1", name: "Account", cnName: "账户", type: newModelType, domain: newModelDomain, layer: "DWD", description: "资金账户", fields: [{ name: "account_id", type: "string", comment: "账户ID", nullable: false, primaryKey: true }], x: 150, y: 140 },
          { id: "t2", name: "Transaction", cnName: "交易流水", type: newModelType, domain: newModelDomain, layer: "DWD", description: "交易记录", fields: [{ name: "txn_id", type: "string", comment: "流水ID", nullable: false, primaryKey: true }], x: 350, y: 140 },
        ],
        relationships: [{ from: "t2", to: "t1", type: "N:1", label: "产生" }],
      },
    };
    const tpl = templates[templateId];
    if (!tpl) return { entities: [], relationships: [] };
    return {
      entities: tpl.entities.map(e => ({
        ...e,
        owner: newModelOwner,
        version: newModelVersion.replace(/^v/, ""),
        updatedAt: today,
      } as Entity)),
      relationships: tpl.relationships,
    };
  };

  // Populate staged data based on chosen creation method
  const populateStagedData = () => {
    if (createMethod === "template") {
      const { entities, relationships } = buildTemplate(selectedTemplate);
      setStagedEntities(entities);
      setStagedRelations(relationships);
    } else if (createMethod === "copy" && copySourceId) {
      const source = models.find(m => m.id === copySourceId);
      if (source) {
        // Re-id to avoid collision and remap relations
        const idMap: Record<string, string> = {};
        const cloned = source.entities.map(e => {
          const newId = `${e.id}_c${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
          idMap[e.id] = newId;
          return { ...e, id: newId };
        });
        setStagedEntities(cloned);
        setStagedRelations(source.relationships.map(r => ({ ...r, from: idMap[r.from] || r.from, to: idMap[r.to] || r.to })));
      }
    } else {
      // blank or import: keep whatever user has staged so far (or empty)
      // Don't reset if user has been adding entities manually
    }
  };

  // Create new model - multi-step (uses stagedEntities & stagedRelations)
  const handleCreateModel = () => {
    if (!newModelName.trim()) {
      showToast("请输入模型名称", "error");
      return;
    }

    const entities = stagedEntities;
    const relationships = stagedRelations;

    const newModel: MetadataModel = {
      id: `m${Date.now()}`,
      name: newModelName.trim(),
      version: newModelVersion,
      type: newModelType,
      description: newModelDesc.trim() || `${newModelType === "conceptual" ? "概念" : newModelType === "logical" ? "逻辑" : "物理"}模型 · ${newModelDomain}`,
      entities,
      relationships,
    };

    setModels([...models, newModel]);
    setSelectedModel(newModel);
    setSelectedEntity(entities[0] || null);
    setShowCreate(false);
    // Reset all form data
    resetWizardForm();

    const summary = entities.length > 0
      ? `, 包含 ${entities.length} 个实体${relationships.length > 0 ? ` / ${relationships.length} 个关系` : ""}`
      : "";
    showToast(`已创建模型「${newModel.name}」${summary}`);
    if (entities.length > 0) {
      setTimeout(() => runAutoLayout(newModel), 100);
    }
  };

  const resetWizardForm = () => {
    setCreateStep(1);
    setNewModelName("");
    setNewModelDesc("");
    setNewModelDomain(defaultBusinessDomain);
    setNewModelOwner("数据治理团队");
    setNewModelVersion("v1.0");
    setNewModelTags([]);
    setCreateMethod("blank");
    setSelectedTemplate("ecommerce");
    setCopySourceId("");
    setStagedEntities([]);
    setStagedRelations([]);
    setExpandedStagedEntity(null);
  };

  // Delete model
  const handleDeleteModel = (target: MetadataModel) => {
    const next = models.filter(m => m.id !== target.id);
    if (next.length === 0) {
      showToast("至少保留一个模型", "error");
      return;
    }
    setModels(next);
    if (selectedModel.id === target.id) {
      setSelectedModel(next[0]);
      setSelectedEntity(next[0].entities[0] || null);
    }
    setDeleteTarget(null);
    showToast(`已删除'{target.name}」`);
  };

  // Export current model as JSON
  const handleExportModel = () => {
    const exportData = {
      name: selectedModel.name,
      version: selectedModel.version,
      type: selectedModel.type,
      description: selectedModel.description,
      entities: selectedModel.entities.map(e => {
        const pos = getPos(e);
        return { ...e, x: pos.x, y: pos.y };
      }),
      relationships: selectedModel.relationships,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedModel.name}_${selectedModel.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("模型已导出为JSON");
  };

  // Download sample import file
  const handleDownloadSample = () => {
    let content = "";
    let filename = "";
    if (importFormat === "json") {
      content = JSON.stringify({
        name: "示例订单模型",
        version: "v1.0",
        type: "logical",
        description: "演示用的订单逻辑模型示例",
        entities: [
          {
            name: "Order", cnName: "订单", type: "logical", domain: "交易域", layer: "DWD",
            description: "订单主表", owner: "示例", version: "1.0", updatedAt: "2024-01-01",
            fields: [
              { name: "order_id", type: "string", comment: "订单ID", nullable: false, primaryKey: true },
              { name: "user_id", type: "string", comment: "用户ID", nullable: false },
              { name: "amount", type: "decimal", comment: "金额", nullable: false },
            ],
          },
          {
            name: "Customer", cnName: "客户", type: "logical", domain: "交易域", layer: "DIM",
            description: "客户信息", owner: "示例", version: "1.0", updatedAt: "2024-01-01",
            fields: [
              { name: "user_id", type: "string", comment: "用户ID", nullable: false, primaryKey: true },
              { name: "name", type: "string", comment: "姓名", nullable: false },
            ],
          },
        ],
        relationships: [{ from: "Customer", to: "Order", type: "1:N", label: "下单" }],
      }, null, 2);
      filename = "sample_model.json";
    } else if (importFormat === "sql") {
      content = `-- 示例 SQL DDL，可直接导入测试
CREATE TABLE \`t_order\` (
  \`order_id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`user_id\` VARCHAR(64) NOT NULL,
  \`amount\` DECIMAL(10,2) NOT NULL,
  \`status\` TINYINT NOT NULL,
  \`create_time\` DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE \`t_user\` (
  \`user_id\` VARCHAR(64) NOT NULL PRIMARY KEY,
  \`name\` VARCHAR(50) NOT NULL,
  \`email\` VARCHAR(100),
  \`phone\` VARCHAR(20)
) ENGINE=InnoDB;
`;
      filename = "sample_model.sql";
    } else {
      showToast("PDM 示例暂未提供", "error");
      return;
    }
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredModels = useMemo(() => {
    return modelType === "all" ? models : models.filter(m => m.type === modelType);
  }, [modelType, models]);

  const stats = useMemo(() => {
    const allEntities = models.flatMap(m => m.entities);
    return {
      totalModels: models.length,
      totalEntities: allEntities.length,
      totalFields: allEntities.reduce((sum, e) => sum + e.fields.length, 0),
      totalRelations: models.reduce((sum, m) => sum + m.relationships.length, 0),
    };
  }, [models]);

  if (error) {
    return <ErrorFallback onRetry={() => window.location.reload()} />;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "元数据管理" }, { label: "元数据模型" }]} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">元数据模型</h1>
          <p className="text-sm text-slate-400">统一管理业务概念、逻辑关系与物理表结构，实现元数据可视化建模'</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowImport(true)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            导入模型
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 text-sm flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建模型
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "模型总数", value: stats.totalModels, icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", color: "from-violet-500/20 to-purple-500/20", iconColor: "text-violet-400" },
          { label: "实体总数", value: stats.totalEntities, icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "from-cyan-500/20 to-blue-500/20", iconColor: "text-cyan-400" },
          { label: "属性总数", value: stats.totalFields, icon: "M4 6h16M4 10h16M4 14h16M4 18h16", color: "from-emerald-500/20 to-teal-500/20", iconColor: "text-emerald-400" },
          { label: "关系总数", value: stats.totalRelations, icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1", color: "from-amber-500/20 to-orange-500/20", iconColor: "text-amber-400" },
        ].map((stat, i) => (
          <div key={i} className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 backdrop-blur-sm">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-50`} />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
              <div className={`p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50 ${stat.iconColor}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-340px)]">
        {/* Left: Model Tree */}
        <div className="col-span-3 flex flex-col rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm overflow-hidden">
          <div className="border-b border-slate-700/50 px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">模型目录</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{filteredModels.length}</span>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900/60 border border-slate-700/50">
              {[
                { k: "all", label: "全部" },
                { k: "conceptual", label: "概念" },
                { k: "logical", label: "逻辑" },
                { k: "physical", label: "物理" },
              ].map((t) => (
                <button
                  key={t.k}
                  onClick={() => setModelType(t.k as any)}
                  className={`flex-1 px-2 py-1 text-[11px] rounded transition-all ${
                    modelType === t.k
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredModels.length === 0 && (
              <div className="text-center py-12 text-xs text-slate-500">该分类下暂无模型</div>
            )}
            {filteredModels.map((model) => (
              <div
                key={model.id}
                onClick={() => {
                  setSelectedModel(model);
                  setSelectedEntity(model.entities[0] || null);
                }}
                className={`group/item relative cursor-pointer w-full text-left p-3 rounded-lg border transition-all ${
                  selectedModel.id === model.id
                    ? "bg-cyan-500/10 border-cyan-500/30"
                    : "border-transparent hover:bg-slate-700/30"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 p-1.5 rounded ${
                    model.type === "conceptual" ? "bg-violet-500/20 text-violet-400" :
                    model.type === "logical" ? "bg-cyan-500/20 text-cyan-400" :
                    "bg-emerald-500/20 text-emerald-400"
                  }`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={model.type === "conceptual" ? "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" : model.type === "logical" ? "M4 5a1 1 0 011-1h4.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H19a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" : "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 pr-5">
                    <div className="text-sm font-medium text-white truncate">{model.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{model.version}</span>
                      <span className="text-[10px] text-slate-500">{model.entities.length} 实体</span>
                      <span className="text-[10px] text-slate-500">·</span>
                      <span className="text-[10px] text-slate-500">{model.relationships.length} 关系</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">{model.description}</div>
                  </div>
                </div>
                {/* Delete button on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(model);
                  }}
                  className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover/item:opacity-100 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                  title="删除模型"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Model Canvas */}
        <div className="col-span-6 flex flex-col rounded-xl border border-slate-700/50 bg-slate-800/20 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-2.5 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-white">{selectedModel.name}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                selectedModel.type === "conceptual" ? "bg-violet-500/10 text-violet-400 border-violet-500/30" :
                selectedModel.type === "logical" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" :
                "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              }`}>
                {selectedModel.type === "conceptual" ? "概念模型" : selectedModel.type === "logical" ? "逻辑模型" : "物理模型"} · {selectedModel.version}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Combined Add Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowCanvasAddMenu(v => !v)}
                  className="px-2.5 py-1 rounded-md bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 hover:from-emerald-500/25 hover:to-cyan-500/25 border border-emerald-500/30 text-emerald-300 transition-all flex items-center gap-1 text-[11px] font-medium"
                  title="添加实体或关系"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  添加
                  <svg className={`w-3 h-3 transition-transform ${showCanvasAddMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showCanvasAddMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowCanvasAddMenu(false)} />
                    <div className="absolute top-full right-0 mt-1.5 w-48 rounded-lg border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      <button
                        onClick={() => {
                          setShowCanvasAddMenu(false);
                          setFormEntity({ name: "", cnName: "", type: selectedModel.type, domain: defaultBusinessDomain, layer: "DWD", description: "", owner: "数据治理团队", version: "1.0", fields: [] });
                          setManageDialog({ type: "entity", mode: "create" });
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-800/80 text-left transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-md bg-emerald-500/10 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-slate-200">新增实体</div>
                          <div className="text-[10px] text-slate-500">创建一个数据实体'</div>
                        </div>
                      </button>
                      <button
                        disabled={selectedModel.entities.length < 2}
                        onClick={() => {
                          setShowCanvasAddMenu(false);
                          setFormRelation({ from: selectedModel.entities[0]?.id || "", to: selectedModel.entities[1]?.id || "", type: "1:N", label: "" });
                          setManageDialog({ type: "relation", mode: "create" });
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-800/80 disabled:opacity-40 disabled:cursor-not-allowed text-left transition-colors group border-t border-slate-800"
                        title={selectedModel.entities.length < 2 ? "至少需要'2 个实体" : "新增关系"}
                      >
                        <div className="w-7 h-7 rounded-md bg-cyan-500/10 group-hover:bg-cyan-500/20 flex items-center justify-center transition-colors">
                          <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-slate-200">新增关系</div>
                          <div className="text-[10px] text-slate-500">{selectedModel.entities.length < 2 ? "需要'2 个实体" : "建立实体关联"}</div>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="w-px h-3.5 bg-slate-700 mx-0.5"></div>
              <button
                onClick={() => runAutoLayout(selectedModel)}
                className="px-2 py-1 rounded hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[11px]"
                title="自动排列"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h6m0 0v12m0-12L4 18m6-12h10m0 0v6m0-6l-6 6m6 0v6m0 0H10" />
                </svg>
                自动排列
              </button>
              <button
                onClick={resetLayout}
                className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                title="重置布局"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={handleExportModel}
                disabled={selectedModel.entities.length === 0}
                className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="导出模型JSON"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <div className="w-px h-4 bg-slate-700" />
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-1.5 rounded hover:bg-slate-700/50 transition-colors ${showGrid ? "text-cyan-400" : "text-slate-500"}`}
                title="网格"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <div className="w-px h-4 bg-slate-700" />
              <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
              </button>
              <span className="text-[11px] text-slate-500 w-8 text-center">{zoom}%</span>
              <button onClick={() => setZoom(Math.min(150, zoom + 10))} className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </div>

          <div className="flex-1 relative overflow-auto bg-[#0a0f1c]">
            {/* Grid */}
            {showGrid && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]">
                <defs>
                  <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="white" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            )}

            <div className="relative min-w-[800px] min-h-[600px] p-8" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                  </marker>
                </defs>
                {selectedModel.relationships.map((rel, i) => {
                  const from = selectedModel.entities.find(e => e.id === rel.from);
                  const to = selectedModel.entities.find(e => e.id === rel.to);
                  if (!from || !to) return null;
                  const fromPos = getPos(from);
                  const toPos = getPos(to);
                  const x1 = fromPos.x + 90;
                  const y1 = fromPos.y + 40;
                  const x2 = toPos.x + 90;
                  const y2 = toPos.y + 40;
                  const midX = (x1 + x2) / 2;
                  const midY = (y1 + y2) / 2;
                  const labelText = rel.label || "";
                  const typeText = rel.type;
                  // crude width estimation
                  const labelW = Math.max(labelText.length * 11, 24) + (typeText.length * 7) + 16;
                  return (
                    <g key={i} className="group/rel">
                      <path
                        d={`M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`}
                        fill="none"
                        stroke="#334155"
                        strokeWidth="1.5"
                        markerEnd="url(#arrow)"
                        className="transition-all group-hover/rel:stroke-cyan-500"
                      />
                      {/* Label background */}
                      <rect
                        x={midX - labelW / 2}
                        y={midY - 11}
                        width={labelW}
                        height={20}
                        rx={10}
                        fill="#0f172a"
                        stroke="#334155"
                        strokeWidth="1"
                        className="transition-all group-hover/rel:stroke-cyan-500/60"
                      />
                      {labelText && (
                        <text
                          x={midX - 4}
                          y={midY + 3}
                          textAnchor="end"
                          className="fill-slate-300 text-[10px] font-medium"
                        >
                          {labelText}
                        </text>
                      )}
                      <text
                        x={labelText ? midX + 2 : midX}
                        y={midY + 3}
                        textAnchor={labelText ? "start" : "middle"}
                        className="fill-cyan-400/90 text-[10px] font-mono"
                      >
                        {typeText}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Entities */}
              {selectedModel.entities.map((entity) => {
                const pos = getPos(entity);
                const isDragging = draggingId === entity.id;
                return (
                <div
                  key={`${entity.id}-${layoutKey}`}
                  className={`absolute select-none ${isDragging ? "cursor-grabbing z-30" : "cursor-grab"} ${selectedEntity?.id === entity.id ? "z-20" : "z-10 hover:z-15"}`}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    width: 180,
                    transition: isDragging ? "none" : "left 400ms cubic-bezier(0.4,0,0.2,1), top 400ms cubic-bezier(0.4,0,0.2,1)",
                  }}
                  onMouseDown={(e) => handleEntityMouseDown(e, entity)}
                  onClick={() => setSelectedEntity(entity)}
                >
                  <div className={`rounded-lg border-2 backdrop-blur-sm transition-colors ${
                    selectedEntity?.id === entity.id
                      ? "border-cyan-500/80 bg-slate-800/90 shadow-lg shadow-cyan-500/20"
                      : isDragging
                      ? "border-cyan-400/60 bg-slate-800/95 shadow-2xl shadow-cyan-500/30"
                      : "border-slate-600/50 bg-slate-800/70 hover:border-slate-500/70 hover:bg-slate-800/85"
                  }`}>
                    {/* Entity Header */}
                    <div className={`px-3 py-2 border-b ${
                      selectedEntity?.id === entity.id ? "border-cyan-500/30 bg-cyan-500/10" : "border-slate-700/50 bg-slate-900/50"
                    } rounded-t-lg`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            entity.layer === "ODS" ? "bg-blue-400" :
                            entity.layer === "DWD" ? "bg-cyan-400" :
                            entity.layer === "DWS" ? "bg-violet-400" :
                            entity.layer === "ADS" ? "bg-pink-400" : "bg-emerald-400"
                          }`} />
                          <span className="text-xs font-semibold text-white">{entity.name}</span>
                        </div>
                        <span className="text-[9px] px-1 py-0.5 rounded bg-slate-700/70 text-slate-400 font-mono">{entity.layer}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{entity.cnName}</div>
                    </div>
                    {/* Fields Preview */}
                    <div className="p-2 space-y-0.5 max-h-[120px] overflow-hidden">
                      {entity.fields.slice(0, 4).map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px]">
                          <span className={`w-3 text-center ${f.primaryKey ? "text-amber-400" : f.foreignKey ? "text-violet-400" : "text-slate-600"}`}>
                            {f.primaryKey ? "🔑" : f.foreignKey ? "🔗" : ""}
                          </span>
                          <span className="font-mono text-slate-300 truncate flex-1">{f.name}</span>
                          <span className="text-slate-500 font-mono">{f.type}</span>
                        </div>
                      ))}
                      {entity.fields.length > 4 && (
                        <div className="text-[9px] text-slate-500 text-center pt-1 border-t border-slate-700/30 mt-1">
                          +{entity.fields.length - 4} fields
                        </div>
                      )}
                     </div>
                   </div>
                 </div>
                );
              })}

              {selectedModel.entities.length > 0 && (
                <div className="absolute bottom-3 right-3 z-30 px-2.5 py-1.5 rounded-md bg-slate-900/80 backdrop-blur border border-slate-700/60 text-[10px] text-slate-400 flex items-center gap-2 pointer-events-none">
                  <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>拖动节点 · 点击「自动排列」一键布局</span>
                </div>
              )}

              {selectedModel.entities.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-500">暂无实体定义</p>
                    <p className="text-xs text-slate-600 mt-1">点击工具栏' 添加」按钮开始构建模'</p>
                    <button
                      onClick={() => {
                        setFormEntity({ name: "", cnName: "", type: selectedModel.type, domain: defaultBusinessDomain, layer: "DWD", description: "", owner: "数据治理团队", version: "1.0", fields: [] });
                        setManageDialog({ type: "entity", mode: "create" });
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                      新增第一个实体'                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Entity Details */}
        <div className="col-span-3 flex flex-col rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm overflow-hidden">
          <div className="border-b border-slate-700/50 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">实体详情</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {selectedEntity ? (
              <div className="p-4 space-y-4">
                {/* Basic Info */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2">
                      <div>
                        <h4 className="text-base font-semibold text-white">{selectedEntity.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{selectedEntity.cnName}</p>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            setFormEntity({ ...selectedEntity });
                            setManageDialog({ type: "entity", mode: "edit", entityId: selectedEntity.id });
                          }}
                          className="p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-cyan-400 transition-colors"
                          title="编辑实体"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            const restEntities = selectedModel.entities.filter(e => e.id !== selectedEntity.id);
                            const restRels = selectedModel.relationships.filter(r => r.from !== selectedEntity.id && r.to !== selectedEntity.id);
                            updateModelData(restEntities, restRels);
                            showToast(`已删除实体'${selectedEntity.name}`, "success");
                          }}
                          className="p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-red-400 transition-colors"
                          title="删除实体"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded border ${
                      selectedEntity.layer === "ODS" ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                      selectedEntity.layer === "DWD" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" :
                      selectedEntity.layer === "DWS" ? "bg-violet-500/10 text-violet-400 border-violet-500/30" :
                      selectedEntity.layer === "ADS" ? "bg-pink-500/10 text-pink-400 border-pink-500/30" :
                      "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    }`}>{selectedEntity.layer}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{selectedEntity.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500">
                    <span>负责人' {selectedEntity.owner}</span>
                    <span>·</span>
                    <span>v{selectedEntity.version}</span>
                  </div>
                </div>

                {/* Fields */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-medium text-slate-300 uppercase tracking-wider">字段列表</h5>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setFormField({ name: "", type: "string", comment: "", nullable: true, primaryKey: false });
                          setManageDialog({ type: "field", mode: "create", entityId: selectedEntity.id });
                        }}
                        className="text-[10px] flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        添加字段
                      </button>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{selectedEntity.fields.length}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {selectedEntity.fields.map((field, i) => (
                      <div key={i} className="group p-2.5 rounded-lg bg-slate-900/40 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {field.primaryKey && <span className="text-[10px]" title="主键">🔑</span>}
                              {field.foreignKey && <span className="text-[10px]" title="外键">🔗</span>}
                              <span className="text-xs font-mono text-white truncate">{field.name}</span>
                              {!field.nullable && <span className="text-[9px] text-amber-400">*</span>}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate">{field.comment}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700/50">{field.type}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
                              <button
                                onClick={() => {
                                  setFormField({ ...field });
                                  setManageDialog({ type: "field", mode: "edit", entityId: selectedEntity.id, field });
                                }}
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
                                title="修改字段"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  const updatedFields = selectedEntity.fields.filter(f => f.name !== field.name);
                                  const updatedEntities = selectedModel.entities.map(e => e.id === selectedEntity.id ? { ...e, fields: updatedFields } : e);
                                  updateModelData(updatedEntities, selectedModel.relationships);
                                  showToast(`已移除字段'${field.name}`, "success");
                                }}
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                                title="删除字段"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        {field.foreignKey && (
                          <div className="mt-1.5 pt-1.5 border-t border-slate-800">
                            <div className="flex items-center gap-1 text-[10px] text-violet-400">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                              <span className="font-mono">{field.foreignKey}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metadata */}
                <div className="pt-3 border-t border-slate-700/50">
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <div className="text-slate-500 mb-1">业务'</div>
                      <div className="text-slate-300">{selectedEntity.domain}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1">更新时间</div>
                      <div className="text-slate-300">{selectedEntity.updatedAt}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors">编辑</button>
                  <button className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-colors">查看DDL</button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-800/50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-500">选择左侧实体查看详情</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowImport(false)}>
          <div className="w-[720px] max-h-[85vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white">导入元数据模型</h3>
                <p className="text-xs text-slate-400 mt-1">支持JSON、SQL DDL、PowerDesigner PDM格式</p>
              </div>
              <button onClick={() => setShowImport(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-140px)]">
              {/* Format Selection */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">导入格式</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "json", name: "JSON模型", desc: "标准元数据JSON", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
                    { id: "sql", name: "SQL DDL", desc: "CREATE TABLE语句", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" },
                    { id: "pdm", name: "PDM文件", desc: "PowerDesigner", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                  ].map(fmt => (
                    <button
                      key={fmt.id}
                      onClick={() => setImportFormat(fmt.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        importFormat === fmt.id
                          ? "border-cyan-500/50 bg-cyan-500/10"
                          : "border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`p-1.5 rounded ${importFormat === fmt.id ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-700/50 text-slate-400"}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={fmt.icon} /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${importFormat === fmt.id ? "text-white" : "text-slate-300"}`}>{fmt.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{fmt.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">选择文件</label>
                  <button
                    onClick={handleDownloadSample}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    下载示例文件
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept={importFormat === "json" ? ".json" : importFormat === "sql" ? ".sql,.ddl" : ".pdm"}
                    onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="model-file-input"
                  />
                  <label
                    htmlFor="model-file-input"
                    className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-600 cursor-pointer transition-all group"
                  >
                    {importFile ? (
                      <div className="text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="text-sm font-medium text-white">{importFile.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{(importFile.size / 1024).toFixed(1)} KB</div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-slate-700/50 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        </div>
                        <div className="text-sm text-slate-300">点击选择文件或拖拽到此处</div>
                        <div className="text-xs text-slate-500 mt-1">支持 {importFormat.toUpperCase()} 格式</div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Error */}
              {importError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <div className="text-sm font-medium text-red-400">解析失败</div>
                    <div className="text-xs text-red-300/80 mt-0.5">{importError}</div>
                  </div>
                </div>
              )}

              {/* Preview */}
              {importPreview && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">预览</label>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">解析成功</span>
                  </div>
                  <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 overflow-hidden">
                    <div className="border-b border-slate-700/50 px-4 py-3 bg-slate-900/40">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">{importPreview.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{importPreview.description}</div>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-slate-500">{importPreview.entities.length} 实体</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-500">{importPreview.entities.reduce((s, e) => s + e.fields.length, 0)} 字段</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-500">{importPreview.relationships.length} 关系</span>
                        </div>
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-3 space-y-2">
                      {importPreview.entities.slice(0, 5).map((ent) => (
                        <div key={ent.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/40 border border-slate-700/30">
                          <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-mono ${
                            ent.layer === "ODS" ? "bg-blue-500/20 text-blue-400" :
                            ent.layer === "DWD" ? "bg-cyan-500/20 text-cyan-400" :
                            ent.layer === "DWS" ? "bg-violet-500/20 text-violet-400" :
                            ent.layer === "ADS" ? "bg-pink-500/20 text-pink-400" :
                            "bg-amber-500/20 text-amber-400"
                          }`}>
                            {ent.layer}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white font-mono">{ent.name}</span>
                              <span className="text-xs text-slate-500">{ent.cnName}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{ent.fields.length} 字段 · {ent.fields.filter(f => f.primaryKey).length} 主键</div>
                          </div>
                        </div>
                      ))}
                      {importPreview.entities.length > 5 && (
                        <div className="text-center py-1.5">
                          <span className="text-xs text-slate-500">还有 {importPreview.entities.length - 5} 个实体'..</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sample */}
              {!importFile && (
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                  <div className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                      <div className="text-xs font-medium text-slate-300 mb-1">示例格式</div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">
                        JSON: {'{ "name": "模型", "entities": [{"name":"table1","fields":[...]}] }'}<br/>
                        SQL: CREATE TABLE `user` (id INT PRIMARY KEY, name VARCHAR(50));
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-700/50 px-6 py-3.5 bg-slate-900/40">
              <button onClick={() => { setShowImport(false); setImportFile(null); setImportPreview(null); setImportError(null); }} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                取消
              </button>
              <button
                onClick={confirmImport}
                disabled={!importPreview}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                确认导入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Model Dialog - Multi-step Wizard */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={() => { setShowCreate(false); resetWizardForm(); }}>
          <div className="w-full max-w-[760px] rounded-2xl border border-slate-700/50 bg-slate-900/95 shadow-2xl overflow-hidden backdrop-blur-xl" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-700/50 bg-slate-900/60 px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </div>
                    新建元数据模型'                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 ml-10">通过向导快速创建标准化的数据模型'</p>
                </div>
                <button onClick={() => { setShowCreate(false); resetWizardForm(); }} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { n: 1, label: "基本信息" },
                  { n: 2, label: "业务上下文" },
                  { n: 3, label: "创建方式" },
                  { n: 4, label: "结构配置" },
                  { n: 5, label: "确认创建" },
                ].map((s, idx) => (
                  <div key={s.n} className="flex items-center flex-1">
                    <div className="flex items-center gap-2.5 flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${createStep > s.n ? "bg-emerald-500 text-black" : createStep === s.n ? "bg-cyan-500 text-black ring-4 ring-cyan-500/20" : "bg-slate-800 text-slate-500 border border-slate-700"}`}>
                        {createStep > s.n ? "" : s.n}
                      </div>
                      <span className={`text-xs font-medium hidden sm:block transition-colors ${createStep >= s.n ? "text-slate-200" : "text-slate-500"}`}>{s.label}</span>
                    </div>
                    {idx < 4 && <div className={`h-px flex-1 mx-2 transition-all ${createStep > s.n ? "bg-emerald-500/50" : "bg-slate-700/50"}`} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 min-h-[380px]">
              {createStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div>
                    <label className="text-sm font-medium text-slate-200 mb-2.5 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">1</span>
                      模型名称 <span className="text-red-400">*</span>
                    </label>
                    <input type="text" value={newModelName} onChange={e => setNewModelName(e.target.value)} placeholder="' 营销域用户画像模" className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all" autoFocus />
                    <p className="text-[11px] text-slate-500 mt-1.5 ml-1">建议格式: {`{业务域}{模型类型}`}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-200 mb-2.5 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">2</span>
                      模型类型
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "conceptual", label: "概念模型", desc: "业务概念抽象", icon: "💡", color: "violet", detail: "用于业务沟通" },
                        { id: "logical", label: "逻辑模型", desc: "实体关系建模", icon: "🔗", color: "cyan", detail: "定义实体关系" },
                        { id: "physical", label: "物理模型", desc: "数据库表结构", icon: "🗄", color: "emerald", detail: "可生成DDL" },
                      ].map(t => (
                        <button key={t.id} onClick={() => setNewModelType(t.id as any)} className={`group relative p-4 rounded-xl border-2 text-left transition-all ${newModelType === t.id ? (t.color === "violet" ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/20" : t.color === "cyan" ? "border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20" : "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20") : "border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-600"}`}>
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-2xl">{t.icon}</span>
                            {newModelType === t.id && <div className={`w-5 h-5 rounded-full flex items-center justify-center ${t.color === "violet" ? "bg-violet-500" : t.color === "cyan" ? "bg-cyan-500" : "bg-emerald-500"}`}><svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>}
                          </div>
                          <div className={`text-sm font-semibold mb-1 ${newModelType === t.id ? (t.color === "violet" ? "text-violet-200" : t.color === "cyan" ? "text-cyan-200" : "text-emerald-200") : "text-slate-200 group-hover:text-white"}`}>{t.label}</div>
                          <div className="text-[11px] text-slate-400">{t.desc}</div>
                          <div className="text-[10px] text-slate-500 mt-1.5">{t.detail}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-200 mb-2.5 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">3</span>
                      模型描述 <span className="text-slate-500 text-[11px] font-normal">(选填)</span>
                    </label>
                    <textarea value={newModelDesc} onChange={e => setNewModelDesc(e.target.value)} placeholder="简要说明该模型的业务范围、用途等..." rows={3} className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none" />
                  </div>
                </div>
              )}

              {createStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-200 mb-2.5 block">业务'</label>
                      <div className="grid grid-cols-2 gap-2">
                        {businessDomainOptions.map(d => (
                          <button key={d} onClick={() => setNewModelDomain(d)} className={`px-3 py-2.5 rounded-lg border text-sm transition-all ${newModelDomain === d ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300" : "border-slate-700/50 bg-slate-800/40 text-slate-300 hover:bg-slate-800"}`}>{d}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-200 mb-2.5 block">负责人'</label>
                      <input type="text" value={newModelOwner} onChange={e => setNewModelOwner(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-white focus:outline-none focus:border-cyan-500/50" />
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {["数据治理团队", "张明", "赵敏", "林峰"].map(p => (<button key={p} onClick={() => setNewModelOwner(p)} className="px-2 py-1 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">{p}</button>))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-200 mb-2.5 block">初始版本</label>
                      <div className="flex gap-2">
                        {["v0.1", "v1.0", "v1.0-beta"].map(v => (<button key={v} onClick={() => setNewModelVersion(v)} className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-mono transition-all ${newModelVersion === v ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300" : "border-slate-700/50 bg-slate-800/40 text-slate-400 hover:bg-slate-800"}`}>{v}</button>))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-200 mb-2.5 block">模型标签 <span className="text-slate-500 text-[11px]">(可多'</span></label>
                      <div className="flex flex-wrap gap-1.5">
                        {["核心资产", "高频访问", "待治理", "已认证", "P0", "对外开放"].map(tag => (<button key={tag} onClick={() => setNewModelTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])} className={`px-2.5 py-1 rounded-full text-[11px] border transition-all ${newModelTags.includes(tag) ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-300" : "border-slate-700/50 bg-slate-800/40 text-slate-400 hover:border-slate-600"}`}>{tag}</button>))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {createStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "blank", icon: "📄", title: "空白模型", desc: "从零开始手动建模", badge: "推荐" },
                      { id: "template", icon: "🎯", title: "使用模板", desc: "基于最佳实践", badge: "快捷" },
                      { id: "import", icon: "📤", title: "导入文件", desc: "从JSON/SQL", badge: null },
                      { id: "copy", icon: "📋", title: "复制现有", desc: "基于已有模型", badge: null },
                    ].map(m => (
                      <button key={m.id} onClick={() => setCreateMethod(m.id as any)} className={`relative p-4 rounded-xl border-2 text-left transition-all ${createMethod === m.id ? "border-cyan-500 bg-cyan-500/10" : "border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50"}`}>
                        {m.badge && <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] bg-cyan-500 text-black font-medium">{m.badge}</span>}
                        <div className="text-2xl mb-2">{m.icon}</div>
                        <div className={`text-sm font-medium mb-1 ${createMethod === m.id ? "text-cyan-200" : "text-slate-200"}`}>{m.title}</div>
                        <div className="text-[11px] text-slate-400">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                  {createMethod === "template" && (
                    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
                      <div className="text-xs font-medium text-slate-300 mb-3">选择模板</div>
                      <div className="space-y-2">
                        {[{ id: "ecommerce", name: "电商交易模板", entities: 3, desc: "订单-用户-商品" }, { id: "usercenter", name: "用户中心模板", entities: 2, desc: "用户基础+画像" }, { id: "finance", name: "财务对账模板", entities: 2, desc: "账户-流水" }].map(t => (
                          <button key={t.id} onClick={() => setSelectedTemplate(t.id)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${selectedTemplate === t.id ? "border-cyan-500/50 bg-cyan-500/5" : "border-slate-700/30 hover:bg-slate-800/50"}`}>
                            <div className="text-left"><div className="text-sm text-slate-200">{t.name}</div><div className="text-[11px] text-slate-500 mt-0.5">{t.desc}</div></div>
                            <div className="text-[11px] px-2 py-1 rounded bg-slate-800 text-slate-400">{t.entities} 实体</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {createMethod === "copy" && (
                    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 max-h-[200px] overflow-y-auto">
                      <div className="text-xs font-medium text-slate-300 mb-3">选择源模型'</div>
                      <div className="space-y-2">
                        {models.map(m => (<button key={m.id} onClick={() => setCopySourceId(m.id)} className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${copySourceId === m.id ? "border-cyan-500/50 bg-cyan-500/5" : "border-slate-700/30 hover:bg-slate-800/50"}`}><div className="text-left"><div className="text-sm text-slate-200">{m.name}</div><div className="text-[11px] text-slate-500">{m.entities.length} 实体</div></div>{copySourceId === m.id && <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center"><svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>}</button>))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {createStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Hint banner */}
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-amber-300 mb-1">此步骤为可选项</div>
                      <div className="text-[11px] text-amber-200/70 leading-relaxed">您可以在此预先配置实体与关系，也可以跳过此步，后续在画布工具栏使用「添加」按钮逐步完善。{createMethod === "template" && " 当前已基于模板预填充"}{createMethod === "copy" && " 当前已基于源模型复制"}</div>
                    </div>
                  </div>

                  {createMethod === "import" ? (
                    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-8 text-center">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>
                      </div>
                      <p className="text-sm text-slate-300 mb-1">导入模式无需在此配置</p>
                      <p className="text-[11px] text-slate-500 mb-4">完成创建后，可使用「导入模型」功能直接导入结'</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 max-h-[440px]">
                      {/* Entities */}
                      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-700/50 px-3 py-2.5 bg-slate-900/40">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center">
                              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
                            </div>
                            <span className="text-xs font-medium text-slate-200">实体</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{stagedEntities.length}</span>
                          </div>
                          <button
                            onClick={() => {
                              setFormEntity({ name: "", cnName: "", type: newModelType, domain: newModelDomain, layer: "DWD", description: "", owner: newModelOwner, version: newModelVersion.replace(/^v/, ""), fields: [] });
                              setManageDialog({ type: "entity", mode: "create", staging: true });
                            }}
                            className="text-[10px] px-2 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            新增实体
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-[300px] max-h-[380px]">
                          {stagedEntities.length === 0 ? (
                            <div className="h-full flex items-center justify-center py-12">
                              <div className="text-center">
                                <div className="w-10 h-10 mx-auto rounded-lg bg-slate-700/30 flex items-center justify-center mb-2">
                                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                </div>
                                <p className="text-[11px] text-slate-500">暂无实体，点击右上角添加</p>
                              </div>
                            </div>
                          ) : stagedEntities.map(entity => {
                            const isExpanded = expandedStagedEntity === entity.id;
                            return (
                              <div key={entity.id} className="rounded-lg border border-slate-700/50 bg-slate-900/40 hover:border-slate-600/70 transition-colors">
                                <div className="flex items-center justify-between p-2.5">
                                  <button onClick={() => setExpandedStagedEntity(isExpanded ? null : entity.id)} className="flex-1 flex items-center gap-2 min-w-0 text-left">
                                    <svg className={`w-3 h-3 text-slate-500 flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-medium text-white truncate">{entity.name}</span>
                                        <span className="text-[10px] text-slate-500 truncate">{entity.cnName}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[9px] px-1 py-0.5 rounded bg-slate-700/50 text-slate-400">{entity.layer}</span>
                                        <span className="text-[9px] text-slate-500">{entity.fields.length} 字段</span>
                                      </div>
                                    </div>
                                  </button>
                                  <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <button
                                      onClick={() => {
                                        setFormEntity(entity);
                                        setManageDialog({ type: "entity", mode: "edit", entityId: entity.id, staging: true });
                                      }}
                                      className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-cyan-400 transition-colors"
                                      title="编辑实体"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setStagedEntities(prev => prev.filter(e => e.id !== entity.id));
                                        setStagedRelations(prev => prev.filter(r => r.from !== entity.id && r.to !== entity.id));
                                        showToast(`已移除实体'${entity.name}`);
                                      }}
                                      className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
                                      title="删除实体"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
                                    </button>
                                  </div>
                                </div>
                                {isExpanded && (
                                  <div className="border-t border-slate-700/50 p-2 bg-slate-900/30">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[10px] text-slate-500 uppercase">字段</span>
                                      <button
                                        onClick={() => {
                                          setFormField({ name: "", type: "string", comment: "", nullable: true, primaryKey: false });
                                          setManageDialog({ type: "field", mode: "create", entityId: entity.id, staging: true });
                                        }}
                                        className="text-[10px] flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300"
                                      >
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                        添加字段
                                      </button>
                                    </div>
                                    {entity.fields.length === 0 ? (
                                      <div className="text-[10px] text-slate-600 text-center py-2">暂无字段</div>
                                    ) : (
                                      <div className="space-y-1">
                                        {entity.fields.map((f, fi) => (
                                          <div key={fi} className="group flex items-center gap-1.5 text-[10px] px-1.5 py-1 rounded hover:bg-slate-800/50">
                                            {f.primaryKey && <span title="主键">🔑</span>}
                                            <span className="font-mono text-slate-200 truncate">{f.name}</span>
                                            <span className="text-slate-600 truncate">{f.comment}</span>
                                            <span className="ml-auto font-mono px-1 py-0.5 rounded bg-slate-800 text-cyan-400">{f.type}</span>
                                            <button
                                              onClick={() => {
                                                const updatedFields = entity.fields.filter(ff => ff.name !== f.name);
                                                setStagedEntities(prev => prev.map(e => e.id === entity.id ? { ...e, fields: updatedFields } : e));
                                              }}
                                              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                                              title="移除字段"
                                            >
                                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Relations */}
                      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-700/50 px-3 py-2.5 bg-slate-900/40">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-cyan-500/20 flex items-center justify-center">
                              <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            </div>
                            <span className="text-xs font-medium text-slate-200">关系</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{stagedRelations.length}</span>
                          </div>
                          <button
                            disabled={stagedEntities.length < 2}
                            onClick={() => {
                              setFormRelation({ from: stagedEntities[0]?.id || "", to: stagedEntities[1]?.id || "", type: "1:N", label: "" });
                              setManageDialog({ type: "relation", mode: "create", staging: true });
                            }}
                            className="text-[10px] px-2 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            新增关系
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-[300px] max-h-[380px]">
                          {stagedEntities.length < 2 ? (
                            <div className="h-full flex items-center justify-center py-12">
                              <div className="text-center">
                                <div className="w-10 h-10 mx-auto rounded-lg bg-slate-700/30 flex items-center justify-center mb-2">
                                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                </div>
                                <p className="text-[11px] text-slate-500">至少需要'2 个实体才可建立关系'</p>
                              </div>
                            </div>
                          ) : stagedRelations.length === 0 ? (
                            <div className="h-full flex items-center justify-center py-12">
                              <p className="text-[11px] text-slate-500">暂无关系，点击右上角添加</p>
                            </div>
                          ) : stagedRelations.map((rel, ri) => {
                            const fromE = stagedEntities.find(e => e.id === rel.from);
                            const toE = stagedEntities.find(e => e.id === rel.to);
                            return (
                              <div key={ri} className="group flex items-center gap-2 p-2.5 rounded-lg border border-slate-700/50 bg-slate-900/40 hover:border-slate-600/70 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <span className="text-slate-200 truncate">{fromE?.name || "?"}</span>
                                    <svg className="w-3 h-3 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                    <span className="text-slate-200 truncate">{toE?.name || "?"}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300">{rel.type}</span>
                                    {rel.label && <span className="text-[10px] text-slate-400 truncate">{rel.label}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      setFormRelation(rel);
                                      setManageDialog({ type: "relation", mode: "edit", relationIndex: ri, staging: true });
                                    }}
                                    className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-cyan-400 transition-colors"
                                    title="编辑关系"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setStagedRelations(prev => prev.filter((_, i) => i !== ri));
                                      showToast("已移除关系");
                                    }}
                                    className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
                                    title="删除关系"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {createStep === 5 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-semibold text-white truncate">{newModelName || "未命名模型"}</div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${newModelType === "conceptual" ? "bg-violet-500/20 text-violet-300" : newModelType === "logical" ? "bg-cyan-500/20 text-cyan-300" : "bg-emerald-500/20 text-emerald-300"}`}>{newModelType === "conceptual" ? "概念" : newModelType === "logical" ? "逻辑" : "物理"}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-700/50 text-slate-300">{newModelDomain}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-700/50 text-slate-300">{newModelVersion}</span>
                          {newModelTags.map(t => <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300">{t}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3"><div className="text-[11px] text-slate-500 mb-1">负责人'</div><div className="text-sm text-slate-200 truncate">{newModelOwner}</div></div>
                    <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3"><div className="text-[11px] text-slate-500 mb-1">创建方式</div><div className="text-sm text-slate-200">{createMethod === "blank" ? "空白" : createMethod === "template" ? "模板" : createMethod === "copy" ? "复制" : "导入"}</div></div>
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"><div className="text-[11px] text-emerald-400/80 mb-1">实体数'</div><div className="text-sm font-semibold text-emerald-300">{stagedEntities.length}</div></div>
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3"><div className="text-[11px] text-cyan-400/80 mb-1">关系数'</div><div className="text-sm font-semibold text-cyan-300">{stagedRelations.length}</div></div>
                  </div>
                  {newModelDesc && <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3"><div className="text-[11px] text-slate-500 mb-1.5">描述</div><div className="text-sm text-slate-300 leading-relaxed">{newModelDesc}</div></div>}
                  {stagedEntities.length === 0 && (
                    <div className="rounded-lg border border-slate-700/30 bg-slate-800/20 p-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-[11px] text-slate-400">未配置实体，创建后可在画布工具栏使用' 添加」继续完善'</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-700/50 px-6 py-4 bg-slate-900/60">
              <div className="text-[11px] text-slate-500">步骤 {createStep} / 5</div>
              <div className="flex items-center gap-2.5">
                {createStep > 1 && <button onClick={() => setCreateStep(s => s - 1)} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">上一步'</button>}
                <button onClick={() => { setShowCreate(false); resetWizardForm(); }} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 transition-colors">取消</button>
                {createStep === 4 && stagedEntities.length === 0 && createMethod !== "import" && (
                  <button onClick={() => setCreateStep(5)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-amber-300 transition-colors">跳过此步</button>
                )}
                {createStep < 5 ? (
                  <button
                    onClick={() => {
                      if (createStep === 1 && !newModelName.trim()) { showToast("请输入模型名称", "error"); return; }
                      if (createStep === 3 && createMethod === "copy" && !copySourceId) { showToast("请选择源模型", "error"); return; }
                      // Populate staged data when entering step 4 for the first time
                      if (createStep === 3 && stagedEntities.length === 0 && (createMethod === "template" || createMethod === "copy")) {
                        populateStagedData();
                      }
                      setCreateStep(s => s + 1);
                    }}
                    className="px-5 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-1.5"
                  >
                    下一步<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                ) : (
                  <button onClick={handleCreateModel} className="px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>创建模型</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entity Manage Dialog */}
      {manageDialog?.type === "entity" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setManageDialog(null)}>
          <div className="w-[480px] rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-base font-semibold text-white">
                {manageDialog.mode === "create" ? "新建实体" : "编辑实体"}
              </h3>
              <button onClick={() => setManageDialog(null)} className="text-slate-400 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">实体英文名'*</label>
                  <input type="text" value={formEntity.name} onChange={e => setFormEntity(prev => ({ ...prev, name: e.target.value }))} placeholder="' OrderDetail" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">实体中文名'</label>
                  <input type="text" value={formEntity.cnName} onChange={e => setFormEntity(prev => ({ ...prev, cnName: e.target.value }))} placeholder="' 订单明细" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">数据分层</label>
                  <select value={formEntity.layer} onChange={e => setFormEntity(prev => ({ ...prev, layer: e.target.value as any }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500">
                    {["ODS", "DWD", "DWS", "ADS", "DIM"].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">负责人'</label>
                  <input type="text" value={formEntity.owner} onChange={e => setFormEntity(prev => ({ ...prev, owner: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">描述信息</label>
                <textarea value={formEntity.description} onChange={e => setFormEntity(prev => ({ ...prev, description: e.target.value }))} placeholder="简要描述实体'.." rows={3} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-800 bg-slate-900/40">
              <button onClick={() => setManageDialog(null)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white">取消</button>
              <button onClick={handleSaveEntity} className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Field Manage Dialog */}
      {manageDialog?.type === "field" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setManageDialog(null)}>
          <div className="w-[450px] rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-base font-semibold text-white">
                {manageDialog.mode === "create" ? "添加字段" : "修改字段"}
              </h3>
              <button onClick={() => setManageDialog(null)} className="text-slate-400 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">字段名称 *</label>
                  <input type="text" value={formField.name} onChange={e => setFormField(prev => ({ ...prev, name: e.target.value }))} placeholder="' user_id" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">字段类型</label>
                  <select value={formField.type} onChange={e => setFormField(prev => ({ ...prev, type: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500">
                    {["string", "int", "bigint", "decimal", "datetime", "boolean", "varchar", "tinyint"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">中文注释</label>
                <input type="text" value={formField.comment} onChange={e => setFormField(prev => ({ ...prev, comment: e.target.value }))} placeholder="' 用户ID" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
              </div>
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formField.primaryKey} onChange={e => setFormField(prev => ({ ...prev, primaryKey: e.target.checked }))} className="rounded border-slate-700 text-cyan-500 bg-slate-800 focus:ring-0 focus:ring-offset-0" />
                  <span className="text-xs text-slate-300 select-none">设为主键</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!formField.nullable} onChange={e => setFormField(prev => ({ ...prev, nullable: !e.target.checked }))} className="rounded border-slate-700 text-cyan-500 bg-slate-800 focus:ring-0 focus:ring-offset-0" />
                  <span className="text-xs text-slate-300 select-none">必填 (NOT NULL)</span>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-800 bg-slate-900/40">
              <button onClick={() => setManageDialog(null)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white">取消</button>
              <button onClick={handleSaveField} className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Relation Manage Dialog */}
      {manageDialog?.type === "relation" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setManageDialog(null)}>
          <div className="w-[450px] rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-base font-semibold text-white">新建关系连线</h3>
              <button onClick={() => setManageDialog(null)} className="text-slate-400 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">来源实体 *</label>
                  <select value={formRelation.from} onChange={e => setFormRelation(prev => ({ ...prev, from: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500">
                    {selectedModel.entities.map(e => <option key={e.id} value={e.id}>{e.name} ({e.cnName})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">目标实体 *</label>
                  <select value={formRelation.to} onChange={e => setFormRelation(prev => ({ ...prev, to: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500">
                    {selectedModel.entities.map(e => <option key={e.id} value={e.id}>{e.name} ({e.cnName})</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">对应关系</label>
                  <select value={formRelation.type} onChange={e => setFormRelation(prev => ({ ...prev, type: e.target.value as any }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500">
                    {["1:1", "1:N", "N:1", "N:M"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">关系名称 / 注释</label>
                  <input type="text" value={formRelation.label} onChange={e => setFormRelation(prev => ({ ...prev, label: e.target.value }))} placeholder="' 归属、明细" className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-800 bg-slate-900/40">
              <button onClick={() => setManageDialog(null)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white">取消</button>
              <button onClick={handleSaveRelation} className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white">确认关联</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="w-[420px] rounded-2xl border border-red-500/30 bg-slate-900 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-white">删除模型</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    确定要删除模型「<span className="text-white font-medium">{deleteTarget.name}</span>」吗？
                  </p>
                  <p className="text-xs text-red-400/80 mt-2">
                    将一并删除 {deleteTarget.entities.length} 个实体和 {deleteTarget.relationships.length} 个关系，此操作不可撤销。
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-5">
                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                  取消
                </button>
                <button
                  onClick={() => handleDeleteModel(deleteTarget)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-400 transition-all"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] animate-fade-in">
          <div className={`px-4 py-3 rounded-lg shadow-2xl border flex items-center gap-2.5 backdrop-blur-md ${
            toast.type === "success"
              ? "bg-emerald-500/90 border-emerald-400/50 text-white"
              : "bg-red-500/90 border-red-400/50 text-white"
          }`}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                toast.type === "success"
                  ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              } />
            </svg>
            <span className="text-sm font-medium">{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
