/**
 * @deprecated Use '@/features/admin/selectors' instead
 */
export { useSelectorsQuery, useSelectorsQuery as useSelectors } from '@/features/admin/selectors/queries';
export {
  useCreateSelectorMutation,
  useCreateSelectorMutation as useCreateSelector,
  useUpdateSelectorMutation,
  useUpdateSelectorMutation as useUpdateSelector,
  useDeleteSelectorMutation,
  useDeleteSelectorMutation as useDeleteSelector,
  useInvalidateSelectorCacheMutation,
  useInvalidateSelectorCacheMutation as useInvalidateSelectorCache,
} from '@/features/admin/selectors/mutations';
