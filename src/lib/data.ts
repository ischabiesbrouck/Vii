import { useAsync } from './useAsync';
import { getDocuments, getSources } from './content';

export const useDocuments = () => useAsync(getDocuments, []);
export const useSources = () => useAsync(getSources, []);
