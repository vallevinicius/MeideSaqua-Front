/** Globais que o VLibras e o Sienna criam em `window`. */
interface Window {
  VLibras?: {
    Widget: new (opcoes: { rootPath: string; position?: string }) => unknown;
  };
  VLibrasWidget?: {
    open?: () => void;
  };
  __asw__onClickScreenReader?: (e: MouseEvent) => void;
}
