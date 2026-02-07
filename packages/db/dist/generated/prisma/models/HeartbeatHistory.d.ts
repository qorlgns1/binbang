import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model HeartbeatHistory
 *
 */
export type HeartbeatHistoryModel = runtime.Types.Result.DefaultSelection<Prisma.$HeartbeatHistoryPayload>;
export type AggregateHeartbeatHistory = {
    _count: HeartbeatHistoryCountAggregateOutputType | null;
    _avg: HeartbeatHistoryAvgAggregateOutputType | null;
    _sum: HeartbeatHistorySumAggregateOutputType | null;
    _min: HeartbeatHistoryMinAggregateOutputType | null;
    _max: HeartbeatHistoryMaxAggregateOutputType | null;
};
export type HeartbeatHistoryAvgAggregateOutputType = {
    id: number | null;
    uptime: number | null;
};
export type HeartbeatHistorySumAggregateOutputType = {
    id: number | null;
    uptime: number | null;
};
export type HeartbeatHistoryMinAggregateOutputType = {
    id: number | null;
    timestamp: Date | null;
    status: string | null;
    isProcessing: boolean | null;
    uptime: number | null;
    workerId: string | null;
};
export type HeartbeatHistoryMaxAggregateOutputType = {
    id: number | null;
    timestamp: Date | null;
    status: string | null;
    isProcessing: boolean | null;
    uptime: number | null;
    workerId: string | null;
};
export type HeartbeatHistoryCountAggregateOutputType = {
    id: number;
    timestamp: number;
    status: number;
    isProcessing: number;
    uptime: number;
    workerId: number;
    _all: number;
};
export type HeartbeatHistoryAvgAggregateInputType = {
    id?: true;
    uptime?: true;
};
export type HeartbeatHistorySumAggregateInputType = {
    id?: true;
    uptime?: true;
};
export type HeartbeatHistoryMinAggregateInputType = {
    id?: true;
    timestamp?: true;
    status?: true;
    isProcessing?: true;
    uptime?: true;
    workerId?: true;
};
export type HeartbeatHistoryMaxAggregateInputType = {
    id?: true;
    timestamp?: true;
    status?: true;
    isProcessing?: true;
    uptime?: true;
    workerId?: true;
};
export type HeartbeatHistoryCountAggregateInputType = {
    id?: true;
    timestamp?: true;
    status?: true;
    isProcessing?: true;
    uptime?: true;
    workerId?: true;
    _all?: true;
};
export type HeartbeatHistoryAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which HeartbeatHistory to aggregate.
     */
    where?: Prisma.HeartbeatHistoryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of HeartbeatHistories to fetch.
     */
    orderBy?: Prisma.HeartbeatHistoryOrderByWithRelationInput | Prisma.HeartbeatHistoryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.HeartbeatHistoryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` HeartbeatHistories from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` HeartbeatHistories.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned HeartbeatHistories
    **/
    _count?: true | HeartbeatHistoryCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: HeartbeatHistoryAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: HeartbeatHistorySumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: HeartbeatHistoryMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: HeartbeatHistoryMaxAggregateInputType;
};
export type GetHeartbeatHistoryAggregateType<T extends HeartbeatHistoryAggregateArgs> = {
    [P in keyof T & keyof AggregateHeartbeatHistory]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateHeartbeatHistory[P]> : Prisma.GetScalarType<T[P], AggregateHeartbeatHistory[P]>;
};
export type HeartbeatHistoryGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.HeartbeatHistoryWhereInput;
    orderBy?: Prisma.HeartbeatHistoryOrderByWithAggregationInput | Prisma.HeartbeatHistoryOrderByWithAggregationInput[];
    by: Prisma.HeartbeatHistoryScalarFieldEnum[] | Prisma.HeartbeatHistoryScalarFieldEnum;
    having?: Prisma.HeartbeatHistoryScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: HeartbeatHistoryCountAggregateInputType | true;
    _avg?: HeartbeatHistoryAvgAggregateInputType;
    _sum?: HeartbeatHistorySumAggregateInputType;
    _min?: HeartbeatHistoryMinAggregateInputType;
    _max?: HeartbeatHistoryMaxAggregateInputType;
};
export type HeartbeatHistoryGroupByOutputType = {
    id: number;
    timestamp: Date;
    status: string;
    isProcessing: boolean;
    uptime: number | null;
    workerId: string;
    _count: HeartbeatHistoryCountAggregateOutputType | null;
    _avg: HeartbeatHistoryAvgAggregateOutputType | null;
    _sum: HeartbeatHistorySumAggregateOutputType | null;
    _min: HeartbeatHistoryMinAggregateOutputType | null;
    _max: HeartbeatHistoryMaxAggregateOutputType | null;
};
type GetHeartbeatHistoryGroupByPayload<T extends HeartbeatHistoryGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<HeartbeatHistoryGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof HeartbeatHistoryGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], HeartbeatHistoryGroupByOutputType[P]> : Prisma.GetScalarType<T[P], HeartbeatHistoryGroupByOutputType[P]>;
}>>;
export type HeartbeatHistoryWhereInput = {
    AND?: Prisma.HeartbeatHistoryWhereInput | Prisma.HeartbeatHistoryWhereInput[];
    OR?: Prisma.HeartbeatHistoryWhereInput[];
    NOT?: Prisma.HeartbeatHistoryWhereInput | Prisma.HeartbeatHistoryWhereInput[];
    id?: Prisma.IntFilter<"HeartbeatHistory"> | number;
    timestamp?: Prisma.DateTimeFilter<"HeartbeatHistory"> | Date | string;
    status?: Prisma.StringFilter<"HeartbeatHistory"> | string;
    isProcessing?: Prisma.BoolFilter<"HeartbeatHistory"> | boolean;
    uptime?: Prisma.FloatNullableFilter<"HeartbeatHistory"> | number | null;
    workerId?: Prisma.StringFilter<"HeartbeatHistory"> | string;
    worker?: Prisma.XOR<Prisma.WorkerHeartbeatScalarRelationFilter, Prisma.WorkerHeartbeatWhereInput>;
};
export type HeartbeatHistoryOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    timestamp?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isProcessing?: Prisma.SortOrder;
    uptime?: Prisma.SortOrderInput | Prisma.SortOrder;
    workerId?: Prisma.SortOrder;
    worker?: Prisma.WorkerHeartbeatOrderByWithRelationInput;
};
export type HeartbeatHistoryWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    AND?: Prisma.HeartbeatHistoryWhereInput | Prisma.HeartbeatHistoryWhereInput[];
    OR?: Prisma.HeartbeatHistoryWhereInput[];
    NOT?: Prisma.HeartbeatHistoryWhereInput | Prisma.HeartbeatHistoryWhereInput[];
    timestamp?: Prisma.DateTimeFilter<"HeartbeatHistory"> | Date | string;
    status?: Prisma.StringFilter<"HeartbeatHistory"> | string;
    isProcessing?: Prisma.BoolFilter<"HeartbeatHistory"> | boolean;
    uptime?: Prisma.FloatNullableFilter<"HeartbeatHistory"> | number | null;
    workerId?: Prisma.StringFilter<"HeartbeatHistory"> | string;
    worker?: Prisma.XOR<Prisma.WorkerHeartbeatScalarRelationFilter, Prisma.WorkerHeartbeatWhereInput>;
}, "id">;
export type HeartbeatHistoryOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    timestamp?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isProcessing?: Prisma.SortOrder;
    uptime?: Prisma.SortOrderInput | Prisma.SortOrder;
    workerId?: Prisma.SortOrder;
    _count?: Prisma.HeartbeatHistoryCountOrderByAggregateInput;
    _avg?: Prisma.HeartbeatHistoryAvgOrderByAggregateInput;
    _max?: Prisma.HeartbeatHistoryMaxOrderByAggregateInput;
    _min?: Prisma.HeartbeatHistoryMinOrderByAggregateInput;
    _sum?: Prisma.HeartbeatHistorySumOrderByAggregateInput;
};
export type HeartbeatHistoryScalarWhereWithAggregatesInput = {
    AND?: Prisma.HeartbeatHistoryScalarWhereWithAggregatesInput | Prisma.HeartbeatHistoryScalarWhereWithAggregatesInput[];
    OR?: Prisma.HeartbeatHistoryScalarWhereWithAggregatesInput[];
    NOT?: Prisma.HeartbeatHistoryScalarWhereWithAggregatesInput | Prisma.HeartbeatHistoryScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"HeartbeatHistory"> | number;
    timestamp?: Prisma.DateTimeWithAggregatesFilter<"HeartbeatHistory"> | Date | string;
    status?: Prisma.StringWithAggregatesFilter<"HeartbeatHistory"> | string;
    isProcessing?: Prisma.BoolWithAggregatesFilter<"HeartbeatHistory"> | boolean;
    uptime?: Prisma.FloatNullableWithAggregatesFilter<"HeartbeatHistory"> | number | null;
    workerId?: Prisma.StringWithAggregatesFilter<"HeartbeatHistory"> | string;
};
export type HeartbeatHistoryCreateInput = {
    timestamp?: Date | string;
    status: string;
    isProcessing?: boolean;
    uptime?: number | null;
    worker?: Prisma.WorkerHeartbeatCreateNestedOneWithoutHistoryInput;
};
export type HeartbeatHistoryUncheckedCreateInput = {
    id?: number;
    timestamp?: Date | string;
    status: string;
    isProcessing?: boolean;
    uptime?: number | null;
    workerId?: string;
};
export type HeartbeatHistoryUpdateInput = {
    timestamp?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    isProcessing?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    uptime?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    worker?: Prisma.WorkerHeartbeatUpdateOneRequiredWithoutHistoryNestedInput;
};
export type HeartbeatHistoryUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    timestamp?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    isProcessing?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    uptime?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    workerId?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type HeartbeatHistoryCreateManyInput = {
    id?: number;
    timestamp?: Date | string;
    status: string;
    isProcessing?: boolean;
    uptime?: number | null;
    workerId?: string;
};
export type HeartbeatHistoryUpdateManyMutationInput = {
    timestamp?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    isProcessing?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    uptime?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
};
export type HeartbeatHistoryUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    timestamp?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    isProcessing?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    uptime?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
    workerId?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type HeartbeatHistoryListRelationFilter = {
    every?: Prisma.HeartbeatHistoryWhereInput;
    some?: Prisma.HeartbeatHistoryWhereInput;
    none?: Prisma.HeartbeatHistoryWhereInput;
};
export type HeartbeatHistoryOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type HeartbeatHistoryCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    timestamp?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isProcessing?: Prisma.SortOrder;
    uptime?: Prisma.SortOrder;
    workerId?: Prisma.SortOrder;
};
export type HeartbeatHistoryAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    uptime?: Prisma.SortOrder;
};
export type HeartbeatHistoryMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    timestamp?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isProcessing?: Prisma.SortOrder;
    uptime?: Prisma.SortOrder;
    workerId?: Prisma.SortOrder;
};
export type HeartbeatHistoryMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    timestamp?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isProcessing?: Prisma.SortOrder;
    uptime?: Prisma.SortOrder;
    workerId?: Prisma.SortOrder;
};
export type HeartbeatHistorySumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    uptime?: Prisma.SortOrder;
};
export type HeartbeatHistoryCreateNestedManyWithoutWorkerInput = {
    create?: Prisma.XOR<Prisma.HeartbeatHistoryCreateWithoutWorkerInput, Prisma.HeartbeatHistoryUncheckedCreateWithoutWorkerInput> | Prisma.HeartbeatHistoryCreateWithoutWorkerInput[] | Prisma.HeartbeatHistoryUncheckedCreateWithoutWorkerInput[];
    connectOrCreate?: Prisma.HeartbeatHistoryCreateOrConnectWithoutWorkerInput | Prisma.HeartbeatHistoryCreateOrConnectWithoutWorkerInput[];
    createMany?: Prisma.HeartbeatHistoryCreateManyWorkerInputEnvelope;
    connect?: Prisma.HeartbeatHistoryWhereUniqueInput | Prisma.HeartbeatHistoryWhereUniqueInput[];
};
export type HeartbeatHistoryUncheckedCreateNestedManyWithoutWorkerInput = {
    create?: Prisma.XOR<Prisma.HeartbeatHistoryCreateWithoutWorkerInput, Prisma.HeartbeatHistoryUncheckedCreateWithoutWorkerInput> | Prisma.HeartbeatHistoryCreateWithoutWorkerInput[] | Prisma.HeartbeatHistoryUncheckedCreateWithoutWorkerInput[];
    connectOrCreate?: Prisma.HeartbeatHistoryCreateOrConnectWithoutWorkerInput | Prisma.HeartbeatHistoryCreateOrConnectWithoutWorkerInput[];
    createMany?: Prisma.HeartbeatHistoryCreateManyWorkerInputEnvelope;
    connect?: Prisma.HeartbeatHistoryWhereUniqueInput | Prisma.HeartbeatHistoryWhereUniqueInput[];
};
export type HeartbeatHistoryUpdateManyWithoutWorkerNestedInput = {
    create?: Prisma.XOR<Prisma.HeartbeatHistoryCreateWithoutWorkerInput, Prisma.HeartbeatHistoryUncheckedCreateWithoutWorkerInput> | Prisma.HeartbeatHistoryCreateWithoutWorkerInput[] | Prisma.HeartbeatHistoryUncheckedCreateWithoutWorkerInput[];
    connectOrCreate?: Prisma.HeartbeatHistoryCreateOrConnectWithoutWorkerInput | Prisma.HeartbeatHistoryCreateOrConnectWithoutWorkerInput[];
    upsert?: Prisma.HeartbeatHistoryUpsertWithWhereUniqueWithoutWorkerInput | Prisma.HeartbeatHistoryUpsertWithWhereUniqueWithoutWorkerInput[];
    createMany?: Prisma.HeartbeatHistoryCreateManyWorkerInputEnvelope;
    set?: Prisma.HeartbeatHistoryWhereUniqueInput | Prisma.HeartbeatHistoryWhereUniqueInput[];
    disconnect?: Prisma.HeartbeatHistoryWhereUniqueInput | Prisma.HeartbeatHistoryWhereUniqueInput[];
    delete?: Prisma.HeartbeatHistoryWhereUniqueInput | Prisma.HeartbeatHistoryWhereUniqueInput[];
    connect?: Prisma.HeartbeatHistoryWhereUniqueInput | Prisma.HeartbeatHistoryWhereUniqueInput[];
    update?: Prisma.HeartbeatHistoryUpdateWithWhereUniqueWithoutWorkerInput | Prisma.HeartbeatHistoryUpdateWithWhereUniqueWithoutWorkerInput[];
    updateMany?: Prisma.HeartbeatHistoryUpdateManyWithWhereWithoutWorkerInput | Prisma.HeartbeatHistoryUpdateManyWithWhereWithoutWorkerInput[];
    deleteMany?: Prisma.HeartbeatHistoryScalarWhereInput | Prisma.HeartbeatHistoryScalarWhereInput[];
};
export type HeartbeatHistoryUncheckedUpdateManyWithoutWorkerNestedInput = {
    create?: Prisma.XOR<Prisma.HeartbeatHistoryCreateWithoutWorkerInput, Prisma.HeartbeatHistoryUncheckedCreateWithoutWorkerInput> | Prisma.HeartbeatHistoryCreateWithoutWorkerInput[] | Prisma.HeartbeatHistoryUncheckedCreateWithoutWorkerInput[];
    connectOrCreate?: Prisma.HeartbeatHistoryCreateOrConnectWithoutWorkerInput | Prisma.HeartbeatHistoryCreateOrConnectWithoutWorkerInput[];
    upsert?: Prisma.HeartbeatHistoryUpsertWithWhereUniqueWithoutWorkerInput | Prisma.HeartbeatHistoryUpsertWithWhereUniqueWithoutWorkerInput[];
    createMany?: Prisma.HeartbeatHistoryCreateManyWorkerInputEnvelope;
    set?: Prisma.HeartbeatHistoryWhereUniqueInput | Prisma.HeartbeatHistoryWhereUniqueInput[];
    disconnect?: Prisma.HeartbeatHistoryWhereUniqueInput | Prisma.HeartbeatHistoryWhereUniqueInput[];
    delete?: Prisma.HeartbeatHistoryWhereUniqueInput | Prisma.HeartbeatHistoryWhereUniqueInput[];
    connect?: Prisma.HeartbeatHistoryWhereUniqueInput | Prisma.HeartbeatHistoryWhereUniqueInput[];
    update?: Prisma.HeartbeatHistoryUpdateWithWhereUniqueWithoutWorkerInput | Prisma.HeartbeatHistoryUpdateWithWhereUniqueWithoutWorkerInput[];
    updateMany?: Prisma.HeartbeatHistoryUpdateManyWithWhereWithoutWorkerInput | Prisma.HeartbeatHistoryUpdateManyWithWhereWithoutWorkerInput[];
    deleteMany?: Prisma.HeartbeatHistoryScalarWhereInput | Prisma.HeartbeatHistoryScalarWhereInput[];
};
export type HeartbeatHistoryCreateWithoutWorkerInput = {
    timestamp?: Date | string;
    status: string;
    isProcessing?: boolean;
    uptime?: number | null;
};
export type HeartbeatHistoryUncheckedCreateWithoutWorkerInput = {
    id?: number;
    timestamp?: Date | string;
    status: string;
    isProcessing?: boolean;
    uptime?: number | null;
};
export type HeartbeatHistoryCreateOrConnectWithoutWorkerInput = {
    where: Prisma.HeartbeatHistoryWhereUniqueInput;
    create: Prisma.XOR<Prisma.HeartbeatHistoryCreateWithoutWorkerInput, Prisma.HeartbeatHistoryUncheckedCreateWithoutWorkerInput>;
};
export type HeartbeatHistoryCreateManyWorkerInputEnvelope = {
    data: Prisma.HeartbeatHistoryCreateManyWorkerInput | Prisma.HeartbeatHistoryCreateManyWorkerInput[];
    skipDuplicates?: boolean;
};
export type HeartbeatHistoryUpsertWithWhereUniqueWithoutWorkerInput = {
    where: Prisma.HeartbeatHistoryWhereUniqueInput;
    update: Prisma.XOR<Prisma.HeartbeatHistoryUpdateWithoutWorkerInput, Prisma.HeartbeatHistoryUncheckedUpdateWithoutWorkerInput>;
    create: Prisma.XOR<Prisma.HeartbeatHistoryCreateWithoutWorkerInput, Prisma.HeartbeatHistoryUncheckedCreateWithoutWorkerInput>;
};
export type HeartbeatHistoryUpdateWithWhereUniqueWithoutWorkerInput = {
    where: Prisma.HeartbeatHistoryWhereUniqueInput;
    data: Prisma.XOR<Prisma.HeartbeatHistoryUpdateWithoutWorkerInput, Prisma.HeartbeatHistoryUncheckedUpdateWithoutWorkerInput>;
};
export type HeartbeatHistoryUpdateManyWithWhereWithoutWorkerInput = {
    where: Prisma.HeartbeatHistoryScalarWhereInput;
    data: Prisma.XOR<Prisma.HeartbeatHistoryUpdateManyMutationInput, Prisma.HeartbeatHistoryUncheckedUpdateManyWithoutWorkerInput>;
};
export type HeartbeatHistoryScalarWhereInput = {
    AND?: Prisma.HeartbeatHistoryScalarWhereInput | Prisma.HeartbeatHistoryScalarWhereInput[];
    OR?: Prisma.HeartbeatHistoryScalarWhereInput[];
    NOT?: Prisma.HeartbeatHistoryScalarWhereInput | Prisma.HeartbeatHistoryScalarWhereInput[];
    id?: Prisma.IntFilter<"HeartbeatHistory"> | number;
    timestamp?: Prisma.DateTimeFilter<"HeartbeatHistory"> | Date | string;
    status?: Prisma.StringFilter<"HeartbeatHistory"> | string;
    isProcessing?: Prisma.BoolFilter<"HeartbeatHistory"> | boolean;
    uptime?: Prisma.FloatNullableFilter<"HeartbeatHistory"> | number | null;
    workerId?: Prisma.StringFilter<"HeartbeatHistory"> | string;
};
export type HeartbeatHistoryCreateManyWorkerInput = {
    id?: number;
    timestamp?: Date | string;
    status: string;
    isProcessing?: boolean;
    uptime?: number | null;
};
export type HeartbeatHistoryUpdateWithoutWorkerInput = {
    timestamp?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    isProcessing?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    uptime?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
};
export type HeartbeatHistoryUncheckedUpdateWithoutWorkerInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    timestamp?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    isProcessing?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    uptime?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
};
export type HeartbeatHistoryUncheckedUpdateManyWithoutWorkerInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    timestamp?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    isProcessing?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    uptime?: Prisma.NullableFloatFieldUpdateOperationsInput | number | null;
};
export type HeartbeatHistorySelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    timestamp?: boolean;
    status?: boolean;
    isProcessing?: boolean;
    uptime?: boolean;
    workerId?: boolean;
    worker?: boolean | Prisma.WorkerHeartbeatDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["heartbeatHistory"]>;
export type HeartbeatHistorySelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    timestamp?: boolean;
    status?: boolean;
    isProcessing?: boolean;
    uptime?: boolean;
    workerId?: boolean;
    worker?: boolean | Prisma.WorkerHeartbeatDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["heartbeatHistory"]>;
export type HeartbeatHistorySelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    timestamp?: boolean;
    status?: boolean;
    isProcessing?: boolean;
    uptime?: boolean;
    workerId?: boolean;
    worker?: boolean | Prisma.WorkerHeartbeatDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["heartbeatHistory"]>;
export type HeartbeatHistorySelectScalar = {
    id?: boolean;
    timestamp?: boolean;
    status?: boolean;
    isProcessing?: boolean;
    uptime?: boolean;
    workerId?: boolean;
};
export type HeartbeatHistoryOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "timestamp" | "status" | "isProcessing" | "uptime" | "workerId", ExtArgs["result"]["heartbeatHistory"]>;
export type HeartbeatHistoryInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    worker?: boolean | Prisma.WorkerHeartbeatDefaultArgs<ExtArgs>;
};
export type HeartbeatHistoryIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    worker?: boolean | Prisma.WorkerHeartbeatDefaultArgs<ExtArgs>;
};
export type HeartbeatHistoryIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    worker?: boolean | Prisma.WorkerHeartbeatDefaultArgs<ExtArgs>;
};
export type $HeartbeatHistoryPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "HeartbeatHistory";
    objects: {
        worker: Prisma.$WorkerHeartbeatPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        timestamp: Date;
        status: string;
        isProcessing: boolean;
        uptime: number | null;
        workerId: string;
    }, ExtArgs["result"]["heartbeatHistory"]>;
    composites: {};
};
export type HeartbeatHistoryGetPayload<S extends boolean | null | undefined | HeartbeatHistoryDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$HeartbeatHistoryPayload, S>;
export type HeartbeatHistoryCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<HeartbeatHistoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: HeartbeatHistoryCountAggregateInputType | true;
};
export interface HeartbeatHistoryDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['HeartbeatHistory'];
        meta: {
            name: 'HeartbeatHistory';
        };
    };
    /**
     * Find zero or one HeartbeatHistory that matches the filter.
     * @param {HeartbeatHistoryFindUniqueArgs} args - Arguments to find a HeartbeatHistory
     * @example
     * // Get one HeartbeatHistory
     * const heartbeatHistory = await prisma.heartbeatHistory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends HeartbeatHistoryFindUniqueArgs>(args: Prisma.SelectSubset<T, HeartbeatHistoryFindUniqueArgs<ExtArgs>>): Prisma.Prisma__HeartbeatHistoryClient<runtime.Types.Result.GetResult<Prisma.$HeartbeatHistoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one HeartbeatHistory that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {HeartbeatHistoryFindUniqueOrThrowArgs} args - Arguments to find a HeartbeatHistory
     * @example
     * // Get one HeartbeatHistory
     * const heartbeatHistory = await prisma.heartbeatHistory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends HeartbeatHistoryFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, HeartbeatHistoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__HeartbeatHistoryClient<runtime.Types.Result.GetResult<Prisma.$HeartbeatHistoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first HeartbeatHistory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HeartbeatHistoryFindFirstArgs} args - Arguments to find a HeartbeatHistory
     * @example
     * // Get one HeartbeatHistory
     * const heartbeatHistory = await prisma.heartbeatHistory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends HeartbeatHistoryFindFirstArgs>(args?: Prisma.SelectSubset<T, HeartbeatHistoryFindFirstArgs<ExtArgs>>): Prisma.Prisma__HeartbeatHistoryClient<runtime.Types.Result.GetResult<Prisma.$HeartbeatHistoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first HeartbeatHistory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HeartbeatHistoryFindFirstOrThrowArgs} args - Arguments to find a HeartbeatHistory
     * @example
     * // Get one HeartbeatHistory
     * const heartbeatHistory = await prisma.heartbeatHistory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends HeartbeatHistoryFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, HeartbeatHistoryFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__HeartbeatHistoryClient<runtime.Types.Result.GetResult<Prisma.$HeartbeatHistoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more HeartbeatHistories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HeartbeatHistoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all HeartbeatHistories
     * const heartbeatHistories = await prisma.heartbeatHistory.findMany()
     *
     * // Get first 10 HeartbeatHistories
     * const heartbeatHistories = await prisma.heartbeatHistory.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const heartbeatHistoryWithIdOnly = await prisma.heartbeatHistory.findMany({ select: { id: true } })
     *
     */
    findMany<T extends HeartbeatHistoryFindManyArgs>(args?: Prisma.SelectSubset<T, HeartbeatHistoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$HeartbeatHistoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a HeartbeatHistory.
     * @param {HeartbeatHistoryCreateArgs} args - Arguments to create a HeartbeatHistory.
     * @example
     * // Create one HeartbeatHistory
     * const HeartbeatHistory = await prisma.heartbeatHistory.create({
     *   data: {
     *     // ... data to create a HeartbeatHistory
     *   }
     * })
     *
     */
    create<T extends HeartbeatHistoryCreateArgs>(args: Prisma.SelectSubset<T, HeartbeatHistoryCreateArgs<ExtArgs>>): Prisma.Prisma__HeartbeatHistoryClient<runtime.Types.Result.GetResult<Prisma.$HeartbeatHistoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many HeartbeatHistories.
     * @param {HeartbeatHistoryCreateManyArgs} args - Arguments to create many HeartbeatHistories.
     * @example
     * // Create many HeartbeatHistories
     * const heartbeatHistory = await prisma.heartbeatHistory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends HeartbeatHistoryCreateManyArgs>(args?: Prisma.SelectSubset<T, HeartbeatHistoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many HeartbeatHistories and returns the data saved in the database.
     * @param {HeartbeatHistoryCreateManyAndReturnArgs} args - Arguments to create many HeartbeatHistories.
     * @example
     * // Create many HeartbeatHistories
     * const heartbeatHistory = await prisma.heartbeatHistory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many HeartbeatHistories and only return the `id`
     * const heartbeatHistoryWithIdOnly = await prisma.heartbeatHistory.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends HeartbeatHistoryCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, HeartbeatHistoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$HeartbeatHistoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a HeartbeatHistory.
     * @param {HeartbeatHistoryDeleteArgs} args - Arguments to delete one HeartbeatHistory.
     * @example
     * // Delete one HeartbeatHistory
     * const HeartbeatHistory = await prisma.heartbeatHistory.delete({
     *   where: {
     *     // ... filter to delete one HeartbeatHistory
     *   }
     * })
     *
     */
    delete<T extends HeartbeatHistoryDeleteArgs>(args: Prisma.SelectSubset<T, HeartbeatHistoryDeleteArgs<ExtArgs>>): Prisma.Prisma__HeartbeatHistoryClient<runtime.Types.Result.GetResult<Prisma.$HeartbeatHistoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one HeartbeatHistory.
     * @param {HeartbeatHistoryUpdateArgs} args - Arguments to update one HeartbeatHistory.
     * @example
     * // Update one HeartbeatHistory
     * const heartbeatHistory = await prisma.heartbeatHistory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends HeartbeatHistoryUpdateArgs>(args: Prisma.SelectSubset<T, HeartbeatHistoryUpdateArgs<ExtArgs>>): Prisma.Prisma__HeartbeatHistoryClient<runtime.Types.Result.GetResult<Prisma.$HeartbeatHistoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more HeartbeatHistories.
     * @param {HeartbeatHistoryDeleteManyArgs} args - Arguments to filter HeartbeatHistories to delete.
     * @example
     * // Delete a few HeartbeatHistories
     * const { count } = await prisma.heartbeatHistory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends HeartbeatHistoryDeleteManyArgs>(args?: Prisma.SelectSubset<T, HeartbeatHistoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more HeartbeatHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HeartbeatHistoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many HeartbeatHistories
     * const heartbeatHistory = await prisma.heartbeatHistory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends HeartbeatHistoryUpdateManyArgs>(args: Prisma.SelectSubset<T, HeartbeatHistoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more HeartbeatHistories and returns the data updated in the database.
     * @param {HeartbeatHistoryUpdateManyAndReturnArgs} args - Arguments to update many HeartbeatHistories.
     * @example
     * // Update many HeartbeatHistories
     * const heartbeatHistory = await prisma.heartbeatHistory.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more HeartbeatHistories and only return the `id`
     * const heartbeatHistoryWithIdOnly = await prisma.heartbeatHistory.updateManyAndReturn({
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
    updateManyAndReturn<T extends HeartbeatHistoryUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, HeartbeatHistoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$HeartbeatHistoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one HeartbeatHistory.
     * @param {HeartbeatHistoryUpsertArgs} args - Arguments to update or create a HeartbeatHistory.
     * @example
     * // Update or create a HeartbeatHistory
     * const heartbeatHistory = await prisma.heartbeatHistory.upsert({
     *   create: {
     *     // ... data to create a HeartbeatHistory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the HeartbeatHistory we want to update
     *   }
     * })
     */
    upsert<T extends HeartbeatHistoryUpsertArgs>(args: Prisma.SelectSubset<T, HeartbeatHistoryUpsertArgs<ExtArgs>>): Prisma.Prisma__HeartbeatHistoryClient<runtime.Types.Result.GetResult<Prisma.$HeartbeatHistoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of HeartbeatHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HeartbeatHistoryCountArgs} args - Arguments to filter HeartbeatHistories to count.
     * @example
     * // Count the number of HeartbeatHistories
     * const count = await prisma.heartbeatHistory.count({
     *   where: {
     *     // ... the filter for the HeartbeatHistories we want to count
     *   }
     * })
    **/
    count<T extends HeartbeatHistoryCountArgs>(args?: Prisma.Subset<T, HeartbeatHistoryCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], HeartbeatHistoryCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a HeartbeatHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HeartbeatHistoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends HeartbeatHistoryAggregateArgs>(args: Prisma.Subset<T, HeartbeatHistoryAggregateArgs>): Prisma.PrismaPromise<GetHeartbeatHistoryAggregateType<T>>;
    /**
     * Group by HeartbeatHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HeartbeatHistoryGroupByArgs} args - Group by arguments.
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
    groupBy<T extends HeartbeatHistoryGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: HeartbeatHistoryGroupByArgs['orderBy'];
    } : {
        orderBy?: HeartbeatHistoryGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, HeartbeatHistoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetHeartbeatHistoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the HeartbeatHistory model
     */
    readonly fields: HeartbeatHistoryFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for HeartbeatHistory.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__HeartbeatHistoryClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    worker<T extends Prisma.WorkerHeartbeatDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.WorkerHeartbeatDefaultArgs<ExtArgs>>): Prisma.Prisma__WorkerHeartbeatClient<runtime.Types.Result.GetResult<Prisma.$WorkerHeartbeatPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
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
 * Fields of the HeartbeatHistory model
 */
export interface HeartbeatHistoryFieldRefs {
    readonly id: Prisma.FieldRef<"HeartbeatHistory", 'Int'>;
    readonly timestamp: Prisma.FieldRef<"HeartbeatHistory", 'DateTime'>;
    readonly status: Prisma.FieldRef<"HeartbeatHistory", 'String'>;
    readonly isProcessing: Prisma.FieldRef<"HeartbeatHistory", 'Boolean'>;
    readonly uptime: Prisma.FieldRef<"HeartbeatHistory", 'Float'>;
    readonly workerId: Prisma.FieldRef<"HeartbeatHistory", 'String'>;
}
/**
 * HeartbeatHistory findUnique
 */
export type HeartbeatHistoryFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which HeartbeatHistory to fetch.
     */
    where: Prisma.HeartbeatHistoryWhereUniqueInput;
};
/**
 * HeartbeatHistory findUniqueOrThrow
 */
export type HeartbeatHistoryFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which HeartbeatHistory to fetch.
     */
    where: Prisma.HeartbeatHistoryWhereUniqueInput;
};
/**
 * HeartbeatHistory findFirst
 */
export type HeartbeatHistoryFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which HeartbeatHistory to fetch.
     */
    where?: Prisma.HeartbeatHistoryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of HeartbeatHistories to fetch.
     */
    orderBy?: Prisma.HeartbeatHistoryOrderByWithRelationInput | Prisma.HeartbeatHistoryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for HeartbeatHistories.
     */
    cursor?: Prisma.HeartbeatHistoryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` HeartbeatHistories from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` HeartbeatHistories.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of HeartbeatHistories.
     */
    distinct?: Prisma.HeartbeatHistoryScalarFieldEnum | Prisma.HeartbeatHistoryScalarFieldEnum[];
};
/**
 * HeartbeatHistory findFirstOrThrow
 */
export type HeartbeatHistoryFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which HeartbeatHistory to fetch.
     */
    where?: Prisma.HeartbeatHistoryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of HeartbeatHistories to fetch.
     */
    orderBy?: Prisma.HeartbeatHistoryOrderByWithRelationInput | Prisma.HeartbeatHistoryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for HeartbeatHistories.
     */
    cursor?: Prisma.HeartbeatHistoryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` HeartbeatHistories from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` HeartbeatHistories.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of HeartbeatHistories.
     */
    distinct?: Prisma.HeartbeatHistoryScalarFieldEnum | Prisma.HeartbeatHistoryScalarFieldEnum[];
};
/**
 * HeartbeatHistory findMany
 */
export type HeartbeatHistoryFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter, which HeartbeatHistories to fetch.
     */
    where?: Prisma.HeartbeatHistoryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of HeartbeatHistories to fetch.
     */
    orderBy?: Prisma.HeartbeatHistoryOrderByWithRelationInput | Prisma.HeartbeatHistoryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing HeartbeatHistories.
     */
    cursor?: Prisma.HeartbeatHistoryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` HeartbeatHistories from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` HeartbeatHistories.
     */
    skip?: number;
    distinct?: Prisma.HeartbeatHistoryScalarFieldEnum | Prisma.HeartbeatHistoryScalarFieldEnum[];
};
/**
 * HeartbeatHistory create
 */
export type HeartbeatHistoryCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * The data needed to create a HeartbeatHistory.
     */
    data: Prisma.XOR<Prisma.HeartbeatHistoryCreateInput, Prisma.HeartbeatHistoryUncheckedCreateInput>;
};
/**
 * HeartbeatHistory createMany
 */
export type HeartbeatHistoryCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many HeartbeatHistories.
     */
    data: Prisma.HeartbeatHistoryCreateManyInput | Prisma.HeartbeatHistoryCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * HeartbeatHistory createManyAndReturn
 */
export type HeartbeatHistoryCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HeartbeatHistory
     */
    select?: Prisma.HeartbeatHistorySelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the HeartbeatHistory
     */
    omit?: Prisma.HeartbeatHistoryOmit<ExtArgs> | null;
    /**
     * The data used to create many HeartbeatHistories.
     */
    data: Prisma.HeartbeatHistoryCreateManyInput | Prisma.HeartbeatHistoryCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.HeartbeatHistoryIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * HeartbeatHistory update
 */
export type HeartbeatHistoryUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * The data needed to update a HeartbeatHistory.
     */
    data: Prisma.XOR<Prisma.HeartbeatHistoryUpdateInput, Prisma.HeartbeatHistoryUncheckedUpdateInput>;
    /**
     * Choose, which HeartbeatHistory to update.
     */
    where: Prisma.HeartbeatHistoryWhereUniqueInput;
};
/**
 * HeartbeatHistory updateMany
 */
export type HeartbeatHistoryUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update HeartbeatHistories.
     */
    data: Prisma.XOR<Prisma.HeartbeatHistoryUpdateManyMutationInput, Prisma.HeartbeatHistoryUncheckedUpdateManyInput>;
    /**
     * Filter which HeartbeatHistories to update
     */
    where?: Prisma.HeartbeatHistoryWhereInput;
    /**
     * Limit how many HeartbeatHistories to update.
     */
    limit?: number;
};
/**
 * HeartbeatHistory updateManyAndReturn
 */
export type HeartbeatHistoryUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the HeartbeatHistory
     */
    select?: Prisma.HeartbeatHistorySelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the HeartbeatHistory
     */
    omit?: Prisma.HeartbeatHistoryOmit<ExtArgs> | null;
    /**
     * The data used to update HeartbeatHistories.
     */
    data: Prisma.XOR<Prisma.HeartbeatHistoryUpdateManyMutationInput, Prisma.HeartbeatHistoryUncheckedUpdateManyInput>;
    /**
     * Filter which HeartbeatHistories to update
     */
    where?: Prisma.HeartbeatHistoryWhereInput;
    /**
     * Limit how many HeartbeatHistories to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.HeartbeatHistoryIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * HeartbeatHistory upsert
 */
export type HeartbeatHistoryUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * The filter to search for the HeartbeatHistory to update in case it exists.
     */
    where: Prisma.HeartbeatHistoryWhereUniqueInput;
    /**
     * In case the HeartbeatHistory found by the `where` argument doesn't exist, create a new HeartbeatHistory with this data.
     */
    create: Prisma.XOR<Prisma.HeartbeatHistoryCreateInput, Prisma.HeartbeatHistoryUncheckedCreateInput>;
    /**
     * In case the HeartbeatHistory was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.HeartbeatHistoryUpdateInput, Prisma.HeartbeatHistoryUncheckedUpdateInput>;
};
/**
 * HeartbeatHistory delete
 */
export type HeartbeatHistoryDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    /**
     * Filter which HeartbeatHistory to delete.
     */
    where: Prisma.HeartbeatHistoryWhereUniqueInput;
};
/**
 * HeartbeatHistory deleteMany
 */
export type HeartbeatHistoryDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which HeartbeatHistories to delete
     */
    where?: Prisma.HeartbeatHistoryWhereInput;
    /**
     * Limit how many HeartbeatHistories to delete.
     */
    limit?: number;
};
/**
 * HeartbeatHistory without action
 */
export type HeartbeatHistoryDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
};
export {};
//# sourceMappingURL=HeartbeatHistory.d.ts.map