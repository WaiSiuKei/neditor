export const DefaultSyncOptions = {
    /**
     * 在模版初始化之后重建布局树时，如果将之前的结果视为有效
     * 那么就不用重新布局。这种情况下通过这个选项来跳过计算节点（Yoga.Node、DOM）的创建
     * true - 只更新布局树
     * false - 更新布局树的同时，更新计算节点
     */
    isInitializing: false,
    /**
     * 同步声明的同时，是否引发布局
     * false - 复用之前的布局结果，只对脏节点进行布局
     * true - 全部节点标记为脏，一律重新布局
     */
    forceRelayout: false,
};

export type ISyncOptions = Partial<typeof DefaultSyncOptions>;
