import Breadcrumb from "./Breadcrumb";

type CapabilityPlaceholderProps = {
  module: string;
  title: string;
  description: string;
  items?: string[];
};

const defaultItems = [
  "业务对象建模",
  "列表与详情视图",
  "审批与权限控制",
  "操作审计与运行状态",
];

export default function CapabilityPlaceholder({
  module,
  title,
  description,
  items = defaultItems,
}: CapabilityPlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: module }, { label: title }]} />
        <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">{description}</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-xl">
        <div className="border-b border-slate-800 bg-slate-900/80 px-5 py-4">
          <div className="text-sm font-medium text-slate-200">能力建设中</div>
          <div className="mt-1 text-xs text-slate-500">
            该能力已纳入平台骨架，后续将补齐业务对象、流程、权限和运行数据。
          </div>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-5">
            <div className="text-sm font-medium text-slate-200">能力定位</div>
            <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-5">
            <div className="text-sm font-medium text-slate-200">后续建设重点</div>
            <div className="mt-3 space-y-2">
              {items.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
