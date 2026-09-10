/** Class names used on TipTap editor / article containers for table styling hooks */
export const richTextTableClass = [
    '[&_.tableWrapper]:my-4 [&_.tableWrapper]:overflow-x-auto',
    '[&_.selectedCell]:bg-primary/10',
    '[&_.column-resize-handle]:pointer-events-none [&_.column-resize-handle]:absolute [&_.column-resize-handle]:top-0 [&_.column-resize-handle]:-right-0.5 [&_.column-resize-handle]:bottom-[-2px] [&_.column-resize-handle]:w-1 [&_.column-resize-handle]:bg-primary',
    '[&.resize-cursor]:cursor-col-resize [&_.resize-cursor]:cursor-col-resize',
].join(' ')
