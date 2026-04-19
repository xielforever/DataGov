import { useState, useEffect, useMemo } from "react";
import { fetchDictCategories, fetchDictItems, createDictCategory, createDictItem, updateDictItem, deleteDictItem } from "../../services/api";
import Breadcrumb from "../../components/common/Breadcrumb";

interface DictCategory {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
}

interface DictItem {
  id: string;
  dictCode: string;
  itemValue: string;
  itemLabel: string;
  sortOrder: number;
  status: "active" | "inactive";
  remark: string;
}

export default function DataDict() {
  const [categories, setCategories] = useState<DictCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<DictCategory | null>(null);
  
  const [items, setItems] = useState<DictItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState<Partial<DictCategory>>({});
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemModalMode, setItemModalMode] = useState<"add" | "edit">("add");
  const [itemForm, setItemForm] = useState<Partial<DictItem>>({});
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DictItem | null>(null);

  const loadCategories = () => {
    fetchDictCategories().then((res) => {
      setCategories(res);
      if (!activeCategory) {
        const firstChild = res.find((c: DictCategory) => c.parentId !== null);
        if (firstChild) setActiveCategory(firstChild);
      }
    });
  };

  const loadItems = () => {
    if (activeCategory && activeCategory.parentId !== null) {
      setLoadingItems(true);
      fetchDictItems(activeCategory.code).then((res) => {
        setItems(res);
        setLoadingItems(false);
      });
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadItems();
  }, [activeCategory]);

  const handleSaveCategory = async () => {
    await createDictCategory(categoryForm);
    setIsCategoryModalOpen(false);
    setCategoryForm({});
    loadCategories();
  };

  const handleSaveItem = async () => {
    if (!activeCategory) return;
    
    if (itemModalMode === "add") {
      await createDictItem(activeCategory.code, { ...itemForm, status: itemForm.status || "active" });
    } else if (itemForm.id) {
      await updateDictItem(activeCategory.code, itemForm.id, itemForm);
    }
    setIsItemModalOpen(false);
    loadItems();
  };

  const handleDeleteItem = async () => {
    if (!activeCategory || !itemToDelete) return;
    await deleteDictItem(activeCategory.code, itemToDelete.id);
    setIsDeleteConfirmOpen(false);
    setItemToDelete(null);
    loadItems();
  };

  const categoryTree = useMemo(() => {
    const parents = categories.filter(c => c.parentId === null);
    return parents.map(p => ({
      ...p,
      children: categories.filter(c => c.parentId === p.id)
    }));
  }, [categories]);

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      !searchKeyword || 
      item.itemLabel.toLowerCase().includes(searchKeyword.toLowerCase()) || 
      item.itemValue.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }, [items, searchKeyword]);

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <Breadcrumb items={[{ label: "数据标准" }, { label: "数据字典" }]} />
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-white">
            数据字典
          </h1>
          <p className="mt-1 text-sm text-slate-400">统一管理系统级枚举值和业务代码字典</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setCategoryForm({});
              setIsCategoryModalOpen(true);
            }}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40">
            <svg className="mr-1 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            新增字典分类
          </button>
        </div>
      </div>

      {/* 主体布局：左侧树 + 右侧表格 */}
      <div className="flex gap-6 flex-1 min-h-[600px]">
        
        {/* 左侧：字典目录树 */}
        <div className="w-72 flex-shrink-0 rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col">
          <div className="mb-4 relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="搜索字典分类..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          
          <div className="overflow-y-auto flex-1 pr-2 space-y-1 custom-scrollbar">
            {categoryTree.map(parent => (
              <div key={parent.id} className="mb-2">
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-slate-300">
                  <svg className="h-4 w-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  {parent.name}
                </div>
                <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-2">
                  {parent.children.map(child => {
                    const isActive = activeCategory?.id === child.id;
                    return (
                      <div 
                        key={child.id}
                        onClick={() => setActiveCategory(child)}
                        className={`group flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
                          isActive ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <svg className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          <span className="truncate" title={`${child.name} (${child.code})`}>{child.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：字典项明细列表 */}
        <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col overflow-hidden">
          {activeCategory ? (
            <>
              {/* 右侧头部：分类信息与操作 */}
              <div className="border-b border-slate-800 p-5 flex items-start justify-between bg-slate-900/60">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    {activeCategory.name}
                    <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                      {activeCategory.code}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">所属域: {categories.find(c => c.id === activeCategory.parentId)?.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      placeholder="搜索字典值或标签..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      setItemModalMode("add");
                      setItemForm({ status: "active", sortOrder: items.length + 1 });
                      setIsItemModalOpen(true);
                    }}
                    className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 flex items-center gap-1 transition">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    添加字典项
                  </button>
                </div>
              </div>

              {/* 右侧表格 */}
              <div className="flex-1 overflow-auto">
                {loadingItems ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950/50 text-xs text-slate-400 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-800">
                      <tr>
                        <th className="px-5 py-3 font-medium">排序</th>
                        <th className="px-5 py-3 font-medium">字典值 (Value)</th>
                        <th className="px-5 py-3 font-medium">字典标签 (Label)</th>
                        <th className="px-5 py-3 font-medium">状态</th>
                        <th className="px-5 py-3 font-medium">描述备注</th>
                        <th className="px-5 py-3 font-medium text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition group">
                          <td className="px-5 py-3 text-slate-500 font-mono">{item.sortOrder}</td>
                          <td className="px-5 py-3">
                            <span className="font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">{item.itemValue}</span>
                          </td>
                          <td className="px-5 py-3 text-white font-medium">{item.itemLabel}</td>
                          <td className="px-5 py-3">
                            {item.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>启用
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>停用
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-400 max-w-[200px] truncate" title={item.remark}>
                            {item.remark || '-'}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition">
                              <button 
                                onClick={() => {
                                  setItemModalMode("edit");
                                  setItemForm(item);
                                  setIsItemModalOpen(true);
                                }}
                                className="text-xs text-cyan-400 hover:text-cyan-300">编辑</button>
                              <button 
                                onClick={() => {
                                  setItemToDelete(item);
                                  setIsDeleteConfirmOpen(true);
                                }}
                                className="text-xs text-red-400 hover:text-red-300">删除</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center">
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/50 mb-3">
                              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2-2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                            </div>
                            <p className="text-sm text-slate-400">当前分类下暂无字典项，或未找到匹配记录</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center flex-col text-slate-500">
              <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p>请在左侧选择一个字典分类以查看明细</p>
            </div>
          )}
        </div>
      </div>

      {/* 新增字典分类弹窗 */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[500px] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">新增字典分类</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">分类名称 <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={categoryForm.name || ""}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="如: 证件类型"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">分类编码 <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={categoryForm.code || ""}
                    onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="如: DICT_ID_TYPE"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">所属父级</label>
                  <select
                    value={categoryForm.parentId || ""}
                    onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value || null })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">-- 作为顶级分类 --</option>
                    {categories.filter(c => c.parentId === null).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </form>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
              <button onClick={() => setIsCategoryModalOpen(false)} className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                取消
              </button>
              <button onClick={handleSaveCategory} className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 字典项表单弹窗 */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[500px] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">
                {itemModalMode === "add" ? "新增字典项" : "编辑字典项"}
              </h3>
              <button onClick={() => setIsItemModalOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">字典值 (Value) <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={itemForm.itemValue || ""}
                      onChange={(e) => setItemForm({ ...itemForm, itemValue: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                      placeholder="如: 1 或 male"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">字典标签 (Label) <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={itemForm.itemLabel || ""}
                      onChange={(e) => setItemForm({ ...itemForm, itemLabel: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                      placeholder="如: 男"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">排序</label>
                    <input
                      type="number"
                      value={itemForm.sortOrder || 0}
                      onChange={(e) => setItemForm({ ...itemForm, sortOrder: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">状态</label>
                    <select
                      value={itemForm.status || "active"}
                      onChange={(e) => setItemForm({ ...itemForm, status: e.target.value as "active" | "inactive" })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="active">启用</option>
                      <option value="inactive">停用</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">描述备注</label>
                  <textarea
                    value={itemForm.remark || ""}
                    onChange={(e) => setItemForm({ ...itemForm, remark: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="选填"
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
              <button onClick={() => setIsItemModalOpen(false)} className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                取消
              </button>
              <button onClick={handleSaveItem} className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-96 rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">确认删除该字典项？</h3>
            <p className="mb-6 text-sm text-slate-400">将删除字典项 <strong>{itemToDelete?.itemLabel} ({itemToDelete?.itemValue})</strong>，该操作不可恢复。</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                取消
              </button>
              <button onClick={handleDeleteItem} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}