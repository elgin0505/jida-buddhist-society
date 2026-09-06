// ──────────────────────────────────────────────────────────────
// 组件库统一出口 - 技大佛学会 UI System
// ──────────────────────────────────────────────────────────────

// 反馈组件
export { Skeleton, ProgressBar, EmptyState } from "@/components/ui/Feedback";

// 表单组件
export {
  FormField,
  Input,
  Textarea,
  Select,
  Button,
  Checkbox,
} from "@/components/form/FormComponents";
export type { ValidationState } from "@/components/form/FormComponents";

// 导航组件
export { BottomTabBar, TopNav } from "@/components/navigation/NavigationComponents";

// 禅意动画组件
export { BreathingGuide, LotusPulse, InkRipple } from "@/components/zen/ZenComponents";
