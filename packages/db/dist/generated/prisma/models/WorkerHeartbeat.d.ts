import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model WorkerHeartbeat
 *
 */
export type WorkerHeartbeatModel = runtime.Types.Result.DefaultSelection<Prisma.$WorkerHeartbeatPayload>;
export type AggregateWorkerHeartbeat = {
    _count: WorkerHeartbeatCountAggregateOutputType | null;
    _avg: WorkerHeartbeatAvgAggregateOutputType | null;
    _sum: WorkerHeartbeatSumAggregateOutputType | null;
    _min: WorkerHeartbeatMinAggregateOutputType | null;
    _max: WorkerHeartbeatMaxAggregateOutputType | null;
};
export type WorkerHeartbeatAvgAggregateOutputType = {
    accommodationsChecked: number | null;
    lastCycleErrors: number | null;
    lastCycleDurationMs: number | null;
};
export type WorkerHeartbeatSumAggregateOutputType = {
    accommodationsChecked: number | null;
    lastCycleErrors: number | null;
    lastCycleDurationMs: number | null;
};
export type WorkerHeartbeatMinAggregateOutputType = {
    id: string | null;
    startedAt: Date | null;
    lastHeartbeatAt: Date | null;
    isProcessing: boolean | null;
    schedule: string | null;
    accommodationsChecked: number | null;
    lastCycleErrors: number | null;
    lastCycleDurationMs: number | null;
    updatedAt: Date | null;
};
export type WorkerHeartbeatMaxAggregateOutputType = {
    id: string | null;
    startedAt: Date | null;
    lastHeartbeatAt: Date | null;
    isProcessing: boolean | null;
    schedule: string | null;
    accommodationsChecked: number | null;
    lastCycleErrors: number | null;
    lastCycleDurationMs: number | null;
    updatedAt: Date | null;
};
export type WorkerHeartbeatCountAggregateOutputType = {
    id: number;
    startedAt: number;
    lastHeartbeatAt: number;
    isProcessing: number;
    schedule: number;
    accommodationsChecked: number;
    lastCycleErrors: number;
    lastCycleDurationMs: number;
    updatedAt: number;
    _all: number;
};
export type WorkerHeartbeatAvgAggregateInputType = {
    accommodationsChecked?: true;
    lastCycleErrors?: true;
    lastCycleDurationMs?: true;
};
export type WorkerHeartbeatSumAggregateInputType = {
    accommodationsChecked?: true;
    lastCycleErrors?: true;
    lastCycleDurationMs?: true;
};
export type WorkerHeartbeatMinAggregateInputType = {
    id?: true;
    startedAt?: true;
    lastHeartbeatAt?: true;
    isProcessing?: true;
    schedule?: true;
    accommodationsChecked?: true;
    lastCycleErrors?: true;
    lastCycleDurationMs?: true;
    updatedAt?: true;
};
export type WorkerHeartbeatMaxAggregateInputType = {
    id?: true;
    startedAt?: true;
    lastHeartbeatAt?: true;
    isProcessing?: true;
    schedule?: true;
    accommodationsChecked?: true;
    lastCycleErrors?: true;
    lastCycleDurationMs?: true;
    updatedAt?: true;
};
export type WorkerHeartbeatCountAggregateInputType = {
    id?: true;
    startedAt?: true;
    lastHeartbeatAt?: true;
    isProcessing?: true;
    schedule?: true;
    accommodationsChecked?: true;
    lastCycleErrors?: true;
    lastCycleDurationMs?: true;
    updatedAt?: true;
    _all?: true;
};
export type WorkerHeartbeatAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which WorkerHeartbeat to aggregate.
     */
    where?: Prisma.WorkerHeartbeatWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of WorkerHeartbeats to fetch.
     */
    orderBy?: Prisma.WorkerHeartbeatOrderByWithRelationInput | Prisma.WorkerHeartbeatOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.WorkerHeartbeatWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` WorkerHeartbeats from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` WorkerHeartbeats.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned WorkerHeartbeats
    **/
    _count?: true | WorkerHeartbeatCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: WorkerHeartbeatAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: WorkerHeartbeatSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: WorkerHeartbeatMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: WorkerHeartbeatMaxAggregateInputType;
};
export type GetWorkerHeartbeatAggregateType<T extends WorkerHeartbeatAggregateArgs> = {
    [P in keyof T & keyof AggregateWorkerHeartbeat]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateWorkerHeartbeat[P]> : Prisma.GetScalarType<T[P], AggregateWorkerHeartbeat[P]>;
};
export type WorkerHeartbeatGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.WorkerHeartbeatWhereInput;
    orderBy?: Prisma.WorkerHeartbeatOrderByWithAggregationInput | Prisma.WorkerHeartbeatOrderByWithAggregationInput[];
    by: Prisma.WorkerHeartbeatScalarFieldEnum[] | Prisma.WorkerHeartbeatScalarFieldEnum;
    having?: Prisma.WorkerHeartbeatScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: WorkerHeartbeatCountAggregateInputType | true;
    _avg?: WorkerHeartbeatAvgAggregateInputType;
    _sum?: WorkerHeartbeatSumAggregateInputType;
    _min?: WorkerHeartbeatMinAggregateInputType;
    _max?: WorkerHeartbeatMaxAggregateInputType;
};
export type WorkerHeartbeatGroupByOutputType = {
    id: string;
    startedAt: Date;
    lastHeartbeatAt: Date;
    isProcessing: boolean;
    schedule: string;
    accommodationsChecked: number;
    lastCycleErrors: number;
    lastCycleDurationMs: number | null;
    updatedAt: Date;
    _count: WorkerHeartbeatCountAggregateOutputType | null;
    _avg: WorkerHeartbeatAvgAggregateOutputType | null;
    _sum: WorkerHeartbeatSumAggregateOutputType | null;
    _min: WorkerHeartbeatMinAggregateOutputType | null;
    _max: WorkerHeartbeatMaxAggregateOutputType | null;
};
type GetWorkerHeartbeatGroupByPayload<T extends WorkerHeartbeatGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<WorkerHeartbeatGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof WorkerHeartbeatGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], WorkerHeartbeatGroupByOutputType[P]> : Prisma.GetScalarType<T[P], WorkerHeartbeatGroupByOutputType[P]>;
}>>;
export type WorkerHeartbeatWhereInput = {
    AND?: Prisma.WorkerHeartbeatWhereInput | Prisma.WorkerHeartbeatWhereInput[];
    OR?: Prisma.WorkerHeartbeatWhereInput[];
    NOT?: Prisma.WorkerHeartbeatWhereInput | Prisma.WorkerHeartbeatWhereInput[];
    id?: Prisma.StringFilter<"WorkerHeartbeat"> | string;
    startedAt?: Prisma.DateTimeFilter<"WorkerHeartbeat"> | Date | string;
    lastHeartbeatAt?: Prisma.DateTimeFilter<"WorkerHeartbeat"> | Date | string;
    isProcessing?: Prisma.BoolFilter<"WorkerHeartbeat"> | boolean;
    schedule?: Prisma.StringFilter<"WorkerHeartbeat"> | string;
    accommodationsChecked?: Prisma.IntFilter<"WorkerHeartbeat"> | number;
    lastCycleErrors?: Prisma.IntFilter<"WorkerHeartbeat"> | number;
    lastCycleDurationMs?: Prisma.IntNullableFilter<"WorkerHeartbeat"> | number | null;
    updatedAt?: Prisma.DateTimeFilter<"WorkerHeartbeat"> | Date | string;
    history?: Prisma.HeartbeatHistoryListRelationFilter;
};
export type WorkerHeartbeatOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    lastHeartbeatAt?: Prisma.SortOrder;
    isProcessing?: Prisma.SortOrder;
    schedule?: Prisma.SortOrder;
    accommodationsChecked?: Prisma.SortOrder;
    lastCycleErrors?: Prisma.SortOrder;
    lastCycleDurationMs?: Prisma.SortOrderInput | Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    history?: Prisma.HeartbeatHistoryOrderByRelationAggregateInput;
};
export type WorkerHeartbeatWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.WorkerHeartbeatWhereInput | Prisma.WorkerHeartbeatWhereInput[];
    OR?: Prisma.WorkerHeartbeatWhereInput[];
    NOT?: Prisma.WorkerHeartbeatWhereInput | Prisma.WorkerHeartbeatWhereInput[];
    startedAt?: Prisma.DateTimeFilter<"WorkerHeartbeat"> | Date | string;
    lastHeartbeatAt?: Prisma.DateTimeFilter<"WorkerHeartbeat"> | Date | string;
    isProcessing?: Prisma.BoolFilter<"WorkerHeartbeat"> | boolean;
    schedule?: Prisma.StringFilter<"WorkerHeartbeat"> | string;
    accommodationsChecked?: Prisma.IntFilter<"WorkerHeartbeat"> | number;
    lastCycleErrors?: Prisma.IntFilter<"WorkerHeartbeat"> | number;
    lastCycleDurationMs?: Prisma.IntNullableFilter<"WorkerHeartbeat"> | number | null;
    updatedAt?: Prisma.DateTimeFilter<"WorkerHeartbeat"> | Date | string;
    history?: Prisma.HeartbeatHistoryListRelationFilter;
}, "id">;
export type WorkerHeartbeatOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    lastHeartbeatAt?: Prisma.SortOrder;
    isProcessing?: Prisma.SortOrder;
    schedule?: Prisma.SortOrder;
    accommodationsChecked?: Prisma.SortOrder;
    lastCycleErrors?: Prisma.SortOrder;
    lastCycleDurationMs?: Prisma.SortOrderInput | Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.WorkerHeartbeatCountOrderByAggregateInput;
    _avg?: Prisma.WorkerHeartbeatAvgOrderByAggregateInput;
    _max?: Prisma.WorkerHeartbeatMaxOrderByAggregateInput;
    _min?: Prisma.WorkerHeartbeatMinOrderByAggregateInput;
    _sum?: Prisma.WorkerHeartbeatSumOrderByAggregateInput;
};
export type WorkerHeartbeatScalarWhereWithAggregatesInput = {
    AND?: Prisma.WorkerHeartbeatScalarWhereWithAggregatesInput | Prisma.WorkerHeartbeatScalarWhereWithAggregatesInput[];
    OR?: Prisma.WorkerHeartbeatScalarWhereWithAggregatesInput[];
    NOT?: Prisma.WorkerHeartbeatScalarWhereWithAggregatesInput | Prisma.WorkerHeartbeatScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"WorkerHeartbeat"> | string;
    startedAt?: Prisma.DateTimeWithAggregatesFilter<"WorkerHeartbeat"> | Date | string;
    lastHeartbeatAt?: Prisma.DateTimeWithAggregatesFilter<"WorkerHeartbeat"> | Date | string;
    isProcessing?: Prisma.BoolWithAggregatesFilter<"WorkerHeartbeat"> | boolean;
    schedule?: Prisma.StringWithAggregatesFilter<"WorkerHeartbeat"> | string;
    accommodationsChecked?: Prisma.IntWithAggregatesFilter<"WorkerHeartbeat"> | number;
    lastCycleErrors?: Prisma.IntWithAggregatesFilter<"WorkerHeartbeat"> | number;
    lastCycleDurationMs?: Prisma.IntNullableWithAggregatesFilter<"WorkerHeartbeat"> | number | null;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"WorkerHeartbeat"> | Date | string;
};
export type WorkerHeartbeatCreateInput = {
    id?: string;
    startedAt?: Date | string;
    lastHeartbeatAt?: Date | string;
    isProcessing?: boolean;
    schedule?: string;
    accommodationsChecked?: number;
    lastCycleErrors?: number;
    lastCycleDurationMs?: number | null;
    updatedAt?: Date | string;
    history?: Prisma.HeartbeatHistoryCreateNestedManyWithoutWorkerInput;
};
export type WorkerHeartbeatUncheckedCreateInput = {
    id?: string;
    startedAt?: Date | string;
    lastHeartbeatAt?: Date | string;
    isProcessing?: boolean;
    schedule?: string;
    accommodationsChecked?: number;
    lastCycleErrors?: number;
    lastCycleDurationMs?: number | null;
    updatedAt?: Date | string;
    history?: Prisma.HeartbeatHistoryUncheckedCreateNestedManyWithoutWorkerInput;
};
export type WorkerHeartbeatUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lastHeartbeatAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    isProcessing?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    schedule?: Prisma.StringFieldUpdateOperationsInput | string;
    accommodationsChecked?: Prisma.IntFieldUpdateOperationsInput | number;
    lastCycleErrors?: Prisma.IntFieldUpdateOperationsInput | number;
    lastCycleDurationMs?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    history?: Prisma.HeartbeatHistoryUpdateManyWithoutWorkerNestedInput;
};
export type WorkerHeartbeatUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lastHeartbeatAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    isProcessing?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    schedule?: Prisma.StringFieldUpdateOperationsInput | string;
    accommodationsChecked?: Prisma.IntFieldUpdateOperationsInput | number;
    lastCycleErrors?: Prisma.IntFieldUpdateOperationsInput | number;
    lastCycleDurationMs?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    history?: Prisma.HeartbeatHistoryUncheckedUpdateManyWithoutWorkerNestedInput;
};
export type WorkerHeartbeatCreateManyInput = {
    id?: string;
    startedAt?: Date | string;
    lastHeartbeatAt?: Date | string;
    isProcessing?: boolean;
    schedule?: string;
    accommodationsChecked?: number;
    lastCycleErrors?: number;
    lastCycleDurationMs?: number | null;
    updatedAt?: Date | string;
};
export type WorkerHeartbeatUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lastHeartbeatAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    isProcessing?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    schedule?: Prisma.StringFieldUpdateOperationsInput | string;
    accommodationsChecked?: Prisma.IntFieldUpdateOperationsInput | number;
    lastCycleErrors?: Prisma.IntFieldUpdateOperationsInput | number;
    lastCycleDurationMs?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WorkerHeartbeatUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lastHeartbeatAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    isProcessing?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    schedule?: Prisma.StringFieldUpdateOperationsInput | string;
    accommodationsChecked?: Prisma.IntFieldUpdateOperationsInput | number;
    lastCycleErrors?: Prisma.IntFieldUpdateOperationsInput | number;
    lastCycleDurationMs?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WorkerHeartbeatCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    lastHeartbeatAt?: Prisma.SortOrder;
    isProcessing?: Prisma.SortOrder;
    schedule?: Prisma.SortOrder;
    accommodationsChecked?: Prisma.SortOrder;
    lastCycleErrors?: Prisma.SortOrder;
    lastCycleDurationMs?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type WorkerHeartbeatAvgOrderByAggregateInput = {
    accommodationsChecked?: Prisma.SortOrder;
    lastCycleErrors?: Prisma.SortOrder;
    lastCycleDurationMs?: Prisma.SortOrder;
};
export type WorkerHeartbeatMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    lastHeartbeatAt?: Prisma.SortOrder;
    isProcessing?: Prisma.SortOrder;
    schedule?: Prisma.SortOrder;
    accommodationsChecked?: Prisma.SortOrder;
    lastCycleErrors?: Prisma.SortOrder;
    lastCycleDurationMs?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type WorkerHeartbeatMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    lastHeartbeatAt?: Prisma.SortOrder;
    isProcessing?: Prisma.SortOrder;
    schedule?: Prisma.SortOrder;
    accommodationsChecked?: Prisma.SortOrder;
    lastCycleErrors?: Prisma.SortOrder;
    lastCycleDurationMs?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type WorkerHeartbeatSumOrderByAggregateInput = {
    accommodationsChecked?: Prisma.SortOrder;
    lastCycleErrors?: Prisma.SortOrder;
    lastCycleDurationMs?: Prisma.SortOrder;
};
export type WorkerHeartbeatScalarRelationFilter = {
    is?: Prisma.WorkerHeartbeatWhereInput;
    isNot?: Prisma.WorkerHeartbeatWhereInput;
};
export type WorkerHeartbeatCreateNestedOneWithoutHistoryInput = {
    create?: Prisma.XOR<Prisma.WorkerHeartbeatCreateWithoutHistoryInput, Prisma.WorkerHeartbeatUncheckedCreateWithoutHistoryInput>;
    connectOrCreate?: Prisma.WorkerHeartbeatCreateOrConnectWithoutHistoryInput;
    connect?: Prisma.WorkerHeartbeatWhereUniqueInput;
};
export type WorkerHeartbeatUpdateOneRequiredWithoutHistoryNestedInput = {
    create?: Prisma.XOR<Prisma.WorkerHeartbeatCreateWithoutHistoryInput, Prisma.WorkerHeartbeatUncheckedCreateWithoutHistoryInput>;
    connectOrCreate?: Prisma.WorkerHeartbeatCreateOrConnectWithoutHistoryInput;
    upsert?: Prisma.WorkerHeartbeatUpsertWithoutHistoryInput;
    connect?: Prisma.WorkerHeartbeatWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.WorkerHeartbeatUpdateToOneWithWhereWithoutHistoryInput, Prisma.WorkerHeartbeatUpdateWithoutHistoryInput>, Prisma.WorkerHeartbeatUncheckedUpdateWithoutHistoryInput>;
};
export type WorkerHeartbeatCreateWithoutHistoryInput = {
    id?: string;
    startedAt?: Date | string;
    lastHeartbeatAt?: Date | string;
    isProcessing?: boolean;
    schedule?: string;
    accommodationsChecked?: number;
    lastCycleErrors?: number;
    lastCycleDurationMs?: number | null;
    updatedAt?: Date | string;
};
export type WorkerHeartbeatUncheckedCreateWithoutHistoryInput = {
    id?: string;
    startedAt?: Date | string;
    lastHeartbeatAt?: Date | string;
    isProcessing?: boolean;
    schedule?: string;
    accommodationsChecked?: number;
    lastCycleErrors?: number;
    lastCycleDurationMs?: number | null;
    updatedAt?: Date | string;
};
export type WorkerHeartbeatCreateOrConnectWithoutHistoryInput = {
    where: Prisma.WorkerHeartbeatWhereUniqueInput;
    create: Prisma.XOR<Prisma.WorkerHeartbeatCreateWithoutHistoryInput, Prisma.WorkerHeartbeatUncheckedCreateWithoutHistoryInput>;
};
export type WorkerHeartbeatUpsertWithoutHistoryInput = {
    update: Prisma.XOR<Prisma.WorkerHeartbeatUpdateWithoutHistoryInput, Prisma.WorkerHeartbeatUncheckedUpdateWithoutHistoryInput>;
    create: Prisma.XOR<Prisma.WorkerHeartbeatCreateWithoutHistoryInput, Prisma.WorkerHeartbeatUncheckedCreateWithoutHistoryInput>;
    where?: Prisma.WorkerHeartbeatWhereInput;
};
export type WorkerHeartbeatUpdateToOneWithWhereWithoutHistoryInput = {
    where?: Prisma.WorkerHeartbeatWhereInput;
    data: Prisma.XOR<Prisma.WorkerHeartbeatUpdateWithoutHistoryInput, Prisma.WorkerHeartbeatUncheckedUpdateWithoutHistoryInput>;
};
export type WorkerHeartbeatUpdateWithoutHistoryInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lastHeartbeatAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    isProcessing?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    schedule?: Prisma.StringFieldUpdateOperationsInput | string;
    accommodationsChecked?: Prisma.IntFieldUpdateOperationsInput | number;
    lastCycleErrors?: Prisma.IntFieldUpdateOperationsInput | number;
    lastCycleDurationMs?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type WorkerHeartbeatUncheckedUpdateWithoutHistoryInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    lastHeartbeatAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    isProcessing?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    schedule?: Prisma.StringFieldUpdateOperationsInput | string;
    accommodationsChecked?: Prisma.IntFieldUpdateOperationsInput | number;
    lastCycleErrors?: Prisma.IntFieldUpdateOperationsInput | number;
    lastCycleDurationMs?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
/**
 * Count Type WorkerHeartbeatCountOutputType
 */
export type WorkerHeartbeatCountOutputType = {
    history: number;
};
export type WorkerHeartbeatCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    history?: boolean | WorkerHeartbeatCountOutputTypeCountHistoryArgs;
};
/**
 * WorkerHeartbeatCountOutputType without action
 */
export type WorkerHeartbeatCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerHeartbeatCountOutputType
     */
    select?: Prisma.WorkerHeartbeatCountOutputTypeSelect<ExtArgs> | null;
};
/**
 * WorkerHeartbeatCountOutputType without action
 */
export type WorkerHeartbeatCountOutputTypeCountHistoryArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.HeartbeatHistoryWhereInput;
};
export type WorkerHeartbeatSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    startedAt?: boolean;
    lastHeartbeatAt?: boolean;
    isProcessing?: boolean;
    schedule?: boolean;
    accommodationsChecked?: boolean;
    lastCycleErrors?: boolean;
    lastCycleDurationMs?: boolean;
    updatedAt?: boolean;
    history?: boolean | Prisma.WorkerHeartbeat$historyArgs<ExtArgs>;
    _count?: boolean | Prisma.WorkerHeartbeatCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["workerHeartbeat"]>;
export type WorkerHeartbeatSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    startedAt?: boolean;
    lastHeartbeatAt?: boolean;
    isProcessing?: boolean;
    schedule?: boolean;
    accommodationsChecked?: boolean;
    lastCycleErrors?: boolean;
    lastCycleDurationMs?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["workerHeartbeat"]>;
export type WorkerHeartbeatSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    startedAt?: boolean;
    lastHeartbeatAt?: boolean;
    isProcessing?: boolean;
    schedule?: boolean;
    accommodationsChecked?: boolean;
    lastCycleErrors?: boolean;
    lastCycleDurationMs?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["workerHeartbeat"]>;
export type WorkerHeartbeatSelectScalar = {
    id?: boolean;
    startedAt?: boolean;
    lastHeartbeatAt?: boolean;
    isProcessing?: boolean;
    schedule?: boolean;
    accommodationsChecked?: boolean;
    lastCycleErrors?: boolean;
    lastCycleDurationMs?: boolean;
    updatedAt?: boolean;
};
export type WorkerHeartbeatOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "startedAt" | "lastHeartbeatAt" | "isProcessing" | "schedule" | "accommodationsChecked" | "lastCycleErrors" | "lastCycleDurationMs" | "updatedAt", ExtArgs["result"]["workerHeartbeat"]>;
export type WorkerHeartbeatInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    history?: boolean | Prisma.WorkerHeartbeat$historyArgs<ExtArgs>;
    _count?: boolean | Prisma.WorkerHeartbeatCountOutputTypeDefaultArgs<ExtArgs>;
};
export type WorkerHeartbeatIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type WorkerHeartbeatIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $WorkerHeartbeatPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "WorkerHeartbeat";
    objects: {
        history: Prisma.$HeartbeatHistoryPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        startedAt: Date;
        lastHeartbeatAt: Date;
        isProcessing: boolean;
        schedule: string;
        accommodationsChecked: number;
        lastCycleErrors: number;
        lastCycleDurationMs: number | null;
        updatedAt: Date;
    }, ExtArgs["result"]["workerHeartbeat"]>;
    composites: {};
};
export type WorkerHeartbeatGetPayload<S extends boolean | null | undefined | WorkerHeartbeatDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$WorkerHeartbeatPayload, S>;
export type WorkerHeartbeatCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<WorkerHeartbeatFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: WorkerHeartbeatCountAggregateInputType | true;
};
export interface WorkerHeartbeatDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['WorkerHeartbeat'];
        meta: {
            name: 'WorkerHeartbeat';
        };
    };
    /**
     * Find zero or one WorkerHeartbeat that matches the filter.
     * @param {WorkerHeartbeatFindUniqueArgs} args - Arguments to find a WorkerHeartbeat
     * @example
     * // Get one WorkerHeartbeat
     * const workerHeartbeat = await prisma.workerHeartbeat.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WorkerHeartbeatFindUniqueArgs>(args: Prisma.SelectSubset<T, WorkerHeartbeatFindUniqueArgs<ExtArgs>>): Prisma.Prisma__WorkerHeartbeatClient<runtime.Types.Result.GetResult<Prisma.$WorkerHeartbeatPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one WorkerHeartbeat that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WorkerHeartbeatFindUniqueOrThrowArgs} args - Arguments to find a WorkerHeartbeat
     * @example
     * // Get one WorkerHeartbeat
     * const workerHeartbeat = await prisma.workerHeartbeat.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WorkerHeartbeatFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, WorkerHeartbeatFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__WorkerHeartbeatClient<runtime.Types.Result.GetResult<Prisma.$WorkerHeartbeatPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first WorkerHeartbeat that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkerHeartbeatFindFirstArgs} args - Arguments to find a WorkerHeartbeat
     * @example
     * // Get one WorkerHeartbeat
     * const workerHeartbeat = await prisma.workerHeartbeat.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WorkerHeartbeatFindFirstArgs>(args?: Prisma.SelectSubset<T, WorkerHeartbeatFindFirstArgs<ExtArgs>>): Prisma.Prisma__WorkerHeartbeatClient<runtime.Types.Result.GetResult<Prisma.$WorkerHeartbeatPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first WorkerHeartbeat that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkerHeartbeatFindFirstOrThrowArgs} args - Arguments to find a WorkerHeartbeat
     * @example
     * // Get one WorkerHeartbeat
     * const workerHeartbeat = await prisma.workerHeartbeat.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WorkerHeartbeatFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, WorkerHeartbeatFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__WorkerHeartbeatClient<runtime.Types.Result.GetResult<Prisma.$WorkerHeartbeatPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more WorkerHeartbeats that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkerHeartbeatFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WorkerHeartbeats
     * const workerHeartbeats = await prisma.workerHeartbeat.findMany()
     *
     * // Get first 10 WorkerHeartbeats
     * const workerHeartbeats = await prisma.workerHeartbeat.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const workerHeartbeatWithIdOnly = await prisma.workerHeartbeat.findMany({ select: { id: true } })
     *
     */
    findMany<T extends WorkerHeartbeatFindManyArgs>(args?: Prisma.SelectSubset<T, WorkerHeartbeatFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WorkerHeartbeatPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a WorkerHeartbeat.
     * @param {WorkerHeartbeatCreateArgs} args - Arguments to create a WorkerHeartbeat.
     * @example
     * // Create one WorkerHeartbeat
     * const WorkerHeartbeat = await prisma.workerHeartbeat.create({
     *   data: {
     *     // ... data to create a WorkerHeartbeat
     *   }
     * })
     *
     */
    create<T extends WorkerHeartbeatCreateArgs>(args: Prisma.SelectSubset<T, WorkerHeartbeatCreateArgs<ExtArgs>>): Prisma.Prisma__WorkerHeartbeatClient<runtime.Types.Result.GetResult<Prisma.$WorkerHeartbeatPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many WorkerHeartbeats.
     * @param {WorkerHeartbeatCreateManyArgs} args - Arguments to create many WorkerHeartbeats.
     * @example
     * // Create many WorkerHeartbeats
     * const workerHeartbeat = await prisma.workerHeartbeat.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends WorkerHeartbeatCreateManyArgs>(args?: Prisma.SelectSubset<T, WorkerHeartbeatCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many WorkerHeartbeats and returns the data saved in the database.
     * @param {WorkerHeartbeatCreateManyAndReturnArgs} args - Arguments to create many WorkerHeartbeats.
     * @example
     * // Create many WorkerHeartbeats
     * const workerHeartbeat = await prisma.workerHeartbeat.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many WorkerHeartbeats and only return the `id`
     * const workerHeartbeatWithIdOnly = await prisma.workerHeartbeat.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends WorkerHeartbeatCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, WorkerHeartbeatCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WorkerHeartbeatPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a WorkerHeartbeat.
     * @param {WorkerHeartbeatDeleteArgs} args - Arguments to delete one WorkerHeartbeat.
     * @example
     * // Delete one WorkerHeartbeat
     * const WorkerHeartbeat = await prisma.workerHeartbeat.delete({
     *   where: {
     *     // ... filter to delete one WorkerHeartbeat
     *   }
     * })
     *
     */
    delete<T extends WorkerHeartbeatDeleteArgs>(args: Prisma.SelectSubset<T, WorkerHeartbeatDeleteArgs<ExtArgs>>): Prisma.Prisma__WorkerHeartbeatClient<runtime.Types.Result.GetResult<Prisma.$WorkerHeartbeatPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one WorkerHeartbeat.
     * @param {WorkerHeartbeatUpdateArgs} args - Arguments to update one WorkerHeartbeat.
     * @example
     * // Update one WorkerHeartbeat
     * const workerHeartbeat = await prisma.workerHeartbeat.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends WorkerHeartbeatUpdateArgs>(args: Prisma.SelectSubset<T, WorkerHeartbeatUpdateArgs<ExtArgs>>): Prisma.Prisma__WorkerHeartbeatClient<runtime.Types.Result.GetResult<Prisma.$WorkerHeartbeatPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more WorkerHeartbeats.
     * @param {WorkerHeartbeatDeleteManyArgs} args - Arguments to filter WorkerHeartbeats to delete.
     * @example
     * // Delete a few WorkerHeartbeats
     * const { count } = await prisma.workerHeartbeat.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends WorkerHeartbeatDeleteManyArgs>(args?: Prisma.SelectSubset<T, WorkerHeartbeatDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more WorkerHeartbeats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkerHeartbeatUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WorkerHeartbeats
     * const workerHeartbeat = await prisma.workerHeartbeat.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends WorkerHeartbeatUpdateManyArgs>(args: Prisma.SelectSubset<T, WorkerHeartbeatUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more WorkerHeartbeats and returns the data updated in the database.
     * @param {WorkerHeartbeatUpdateManyAndReturnArgs} args - Arguments to update many WorkerHeartbeats.
     * @example
     * // Update many WorkerHeartbeats
     * const workerHeartbeat = await prisma.workerHeartbeat.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more WorkerHeartbeats and only return the `id`
     * const workerHeartbeatWithIdOnly = await prisma.workerHeartbeat.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends WorkerHeartbeatUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, WorkerHeartbeatUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$WorkerHeartbeatPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one WorkerHeartbeat.
     * @param {WorkerHeartbeatUpsertArgs} args - Arguments to update or create a WorkerHeartbeat.
     * @example
     * // Update or create a WorkerHeartbeat
     * const workerHeartbeat = await prisma.workerHeartbeat.upsert({
     *   create: {
     *     // ... data to create a WorkerHeartbeat
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WorkerHeartbeat we want to update
     *   }
     * })
     */
    upsert<T extends WorkerHeartbeatUpsertArgs>(args: Prisma.SelectSubset<T, WorkerHeartbeatUpsertArgs<ExtArgs>>): Prisma.Prisma__WorkerHeartbeatClient<runtime.Types.Result.GetResult<Prisma.$WorkerHeartbeatPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of WorkerHeartbeats.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkerHeartbeatCountArgs} args - Arguments to filter WorkerHeartbeats to count.
     * @example
     * // Count the number of WorkerHeartbeats
     * const count = await prisma.workerHeartbeat.count({
     *   where: {
     *     // ... the filter for the WorkerHeartbeats we want to count
     *   }
     * })
    **/
    count<T extends WorkerHeartbeatCountArgs>(args?: Prisma.Subset<T, WorkerHeartbeatCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], WorkerHeartbeatCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a WorkerHeartbeat.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkerHeartbeatAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorkerHeartbeatAggregateArgs>(args: Prisma.Subset<T, WorkerHeartbeatAggregateArgs>): Prisma.PrismaPromise<GetWorkerHeartbeatAggregateType<T>>;
    /**
     * Group by WorkerHeartbeat.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkerHeartbeatGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<T extends WorkerHeartbeatGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: WorkerHeartbeatGroupByArgs['orderBy'];
    } : {
        orderBy?: WorkerHeartbeatGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, WorkerHeartbeatGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkerHeartbeatGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the WorkerHeartbeat model
     */
    readonly fields: WorkerHeartbeatFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for WorkerHeartbeat.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__WorkerHeartbeatClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    history<T extends Prisma.WorkerHeartbeat$historyArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.WorkerHeartbeat$historyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$HeartbeatHistoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
/**
 * Fields of the WorkerHeartbeat model
 */
export interface WorkerHeartbeatFieldRefs {
    readonly id: Prisma.FieldRef<"WorkerHeartbeat", 'String'>;
    readonly startedAt: Prisma.FieldRef<"WorkerHeartbeat", 'DateTime'>;
    readonly lastHeartbeatAt: Prisma.FieldRef<"WorkerHeartbeat", 'DateTime'>;
    readonly isProcessing: Prisma.FieldRef<"WorkerHeartbeat", 'Boolean'>;
    readonly schedule: Prisma.FieldRef<"WorkerHeartbeat", 'String'>;
    readonly accommodationsChecked: Prisma.FieldRef<"WorkerHeartbeat", 'Int'>;
    readonly lastCycleErrors: Prisma.FieldRef<"WorkerHeartbeat", 'Int'>;
    readonly lastCycleDurationMs: Prisma.FieldRef<"WorkerHeartbeat", 'Int'>;
    readonly updatedAt: Prisma.FieldRef<"WorkerHeartbeat", 'DateTime'>;
}
/**
 * WorkerHeartbeat findUnique
 */
export type WorkerHeartbeatFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerHeartbeat
     */
    select?: Prisma.WorkerHeartbeatSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkerHeartbeat
     */
    omit?: Prisma.WorkerHeartbeatOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkerHeartbeatInclude<ExtArgs> | null;
    /**
     * Filter, which WorkerHeartbeat to fetch.
     */
    where: Prisma.WorkerHeartbeatWhereUniqueInput;
};
/**
 * WorkerHeartbeat findUniqueOrThrow
 */
export type WorkerHeartbeatFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerHeartbeat
     */
    select?: Prisma.WorkerHeartbeatSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkerHeartbeat
     */
    omit?: Prisma.WorkerHeartbeatOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkerHeartbeatInclude<ExtArgs> | null;
    /**
     * Filter, which WorkerHeartbeat to fetch.
     */
    where: Prisma.WorkerHeartbeatWhereUniqueInput;
};
/**
 * WorkerHeartbeat findFirst
 */
export type WorkerHeartbeatFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerHeartbeat
     */
    select?: Prisma.WorkerHeartbeatSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkerHeartbeat
     */
    omit?: Prisma.WorkerHeartbeatOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkerHeartbeatInclude<ExtArgs> | null;
    /**
     * Filter, which WorkerHeartbeat to fetch.
     */
    where?: Prisma.WorkerHeartbeatWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of WorkerHeartbeats to fetch.
     */
    orderBy?: Prisma.WorkerHeartbeatOrderByWithRelationInput | Prisma.WorkerHeartbeatOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for WorkerHeartbeats.
     */
    cursor?: Prisma.WorkerHeartbeatWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` WorkerHeartbeats from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` WorkerHeartbeats.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of WorkerHeartbeats.
     */
    distinct?: Prisma.WorkerHeartbeatScalarFieldEnum | Prisma.WorkerHeartbeatScalarFieldEnum[];
};
/**
 * WorkerHeartbeat findFirstOrThrow
 */
export type WorkerHeartbeatFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerHeartbeat
     */
    select?: Prisma.WorkerHeartbeatSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkerHeartbeat
     */
    omit?: Prisma.WorkerHeartbeatOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkerHeartbeatInclude<ExtArgs> | null;
    /**
     * Filter, which WorkerHeartbeat to fetch.
     */
    where?: Prisma.WorkerHeartbeatWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of WorkerHeartbeats to fetch.
     */
    orderBy?: Prisma.WorkerHeartbeatOrderByWithRelationInput | Prisma.WorkerHeartbeatOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for WorkerHeartbeats.
     */
    cursor?: Prisma.WorkerHeartbeatWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` WorkerHeartbeats from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` WorkerHeartbeats.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of WorkerHeartbeats.
     */
    distinct?: Prisma.WorkerHeartbeatScalarFieldEnum | Prisma.WorkerHeartbeatScalarFieldEnum[];
};
/**
 * WorkerHeartbeat findMany
 */
export type WorkerHeartbeatFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerHeartbeat
     */
    select?: Prisma.WorkerHeartbeatSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkerHeartbeat
     */
    omit?: Prisma.WorkerHeartbeatOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkerHeartbeatInclude<ExtArgs> | null;
    /**
     * Filter, which WorkerHeartbeats to fetch.
     */
    where?: Prisma.WorkerHeartbeatWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of WorkerHeartbeats to fetch.
     */
    orderBy?: Prisma.WorkerHeartbeatOrderByWithRelationInput | Prisma.WorkerHeartbeatOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing WorkerHeartbeats.
     */
    cursor?: Prisma.WorkerHeartbeatWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` WorkerHeartbeats from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` WorkerHeartbeats.
     */
    skip?: number;
    distinct?: Prisma.WorkerHeartbeatScalarFieldEnum | Prisma.WorkerHeartbeatScalarFieldEnum[];
};
/**
 * WorkerHeartbeat create
 */
export type WorkerHeartbeatCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerHeartbeat
     */
    select?: Prisma.WorkerHeartbeatSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkerHeartbeat
     */
    omit?: Prisma.WorkerHeartbeatOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkerHeartbeatInclude<ExtArgs> | null;
    /**
     * The data needed to create a WorkerHeartbeat.
     */
    data: Prisma.XOR<Prisma.WorkerHeartbeatCreateInput, Prisma.WorkerHeartbeatUncheckedCreateInput>;
};
/**
 * WorkerHeartbeat createMany
 */
export type WorkerHeartbeatCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many WorkerHeartbeats.
     */
    data: Prisma.WorkerHeartbeatCreateManyInput | Prisma.WorkerHeartbeatCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * WorkerHeartbeat createManyAndReturn
 */
export type WorkerHeartbeatCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerHeartbeat
     */
    select?: Prisma.WorkerHeartbeatSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkerHeartbeat
     */
    omit?: Prisma.WorkerHeartbeatOmit<ExtArgs> | null;
    /**
     * The data used to create many WorkerHeartbeats.
     */
    data: Prisma.WorkerHeartbeatCreateManyInput | Prisma.WorkerHeartbeatCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * WorkerHeartbeat update
 */
export type WorkerHeartbeatUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerHeartbeat
     */
    select?: Prisma.WorkerHeartbeatSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkerHeartbeat
     */
    omit?: Prisma.WorkerHeartbeatOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkerHeartbeatInclude<ExtArgs> | null;
    /**
     * The data needed to update a WorkerHeartbeat.
     */
    data: Prisma.XOR<Prisma.WorkerHeartbeatUpdateInput, Prisma.WorkerHeartbeatUncheckedUpdateInput>;
    /**
     * Choose, which WorkerHeartbeat to update.
     */
    where: Prisma.WorkerHeartbeatWhereUniqueInput;
};
/**
 * WorkerHeartbeat updateMany
 */
export type WorkerHeartbeatUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update WorkerHeartbeats.
     */
    data: Prisma.XOR<Prisma.WorkerHeartbeatUpdateManyMutationInput, Prisma.WorkerHeartbeatUncheckedUpdateManyInput>;
    /**
     * Filter which WorkerHeartbeats to update
     */
    where?: Prisma.WorkerHeartbeatWhereInput;
    /**
     * Limit how many WorkerHeartbeats to update.
     */
    limit?: number;
};
/**
 * WorkerHeartbeat updateManyAndReturn
 */
export type WorkerHeartbeatUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerHeartbeat
     */
    select?: Prisma.WorkerHeartbeatSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkerHeartbeat
     */
    omit?: Prisma.WorkerHeartbeatOmit<ExtArgs> | null;
    /**
     * The data used to update WorkerHeartbeats.
     */
    data: Prisma.XOR<Prisma.WorkerHeartbeatUpdateManyMutationInput, Prisma.WorkerHeartbeatUncheckedUpdateManyInput>;
    /**
     * Filter which WorkerHeartbeats to update
     */
    where?: Prisma.WorkerHeartbeatWhereInput;
    /**
     * Limit how many WorkerHeartbeats to update.
     */
    limit?: number;
};
/**
 * WorkerHeartbeat upsert
 */
export type WorkerHeartbeatUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerHeartbeat
     */
    select?: Prisma.WorkerHeartbeatSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkerHeartbeat
     */
    omit?: Prisma.WorkerHeartbeatOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkerHeartbeatInclude<ExtArgs> | null;
    /**
     * The filter to search for the WorkerHeartbeat to update in case it exists.
     */
    where: Prisma.WorkerHeartbeatWhereUniqueInput;
    /**
     * In case the WorkerHeartbeat found by the `where` argument doesn't exist, create a new WorkerHeartbeat with this data.
     */
    create: Prisma.XOR<Prisma.WorkerHeartbeatCreateInput, Prisma.WorkerHeartbeatUncheckedCreateInput>;
    /**
     * In case the WorkerHeartbeat was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.WorkerHeartbeatUpdateInput, Prisma.WorkerHeartbeatUncheckedUpdateInput>;
};
/**
 * WorkerHeartbeat delete
 */
export type WorkerHeartbeatDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerHeartbeat
     */
    select?: Prisma.WorkerHeartbeatSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkerHeartbeat
     */
    omit?: Prisma.WorkerHeartbeatOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkerHeartbeatInclude<ExtArgs> | null;
    /**
     * Filter which WorkerHeartbeat to delete.
     */
    where: Prisma.WorkerHeartbeatWhereUniqueInput;
};
/**
 * WorkerHeartbeat deleteMany
 */
export type WorkerHeartbeatDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which WorkerHeartbeats to delete
     */
    where?: Prisma.WorkerHeartbeatWhereInput;
    /**
     * Limit how many WorkerHeartbeats to delete.
     */
    limit?: number;
};
/**
 * WorkerHeartbeat.history
 */
export type WorkerHeartbeat$historyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HeartbeatHistory
     */
    select?: Prisma.HeartbeatHistorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the HeartbeatHistory
     */
    omit?: Prisma.HeartbeatHistoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.HeartbeatHistoryInclude<ExtArgs> | null;
    where?: Prisma.HeartbeatHistoryWhereInput;
    orderBy?: Prisma.HeartbeatHistoryOrderByWithRelationInput | Prisma.HeartbeatHistoryOrderByWithRelationInput[];
    cursor?: Prisma.HeartbeatHistoryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.HeartbeatHistoryScalarFieldEnum | Prisma.HeartbeatHistoryScalarFieldEnum[];
};
/**
 * WorkerHeartbeat without action
 */
export type WorkerHeartbeatDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerHeartbeat
     */
    select?: Prisma.WorkerHeartbeatSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the WorkerHeartbeat
     */
    omit?: Prisma.WorkerHeartbeatOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.WorkerHeartbeatInclude<ExtArgs> | null;
};
export {};
//# sourceMappingURL=WorkerHeartbeat.d.ts.map