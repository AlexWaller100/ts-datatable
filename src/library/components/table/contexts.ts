import { createContext, DetailedHTMLProps, TdHTMLAttributes, HTMLAttributes } from 'react';
import {
  DataColumn,
  ColumnSorts,
  ColumnSort,
  OnShowColumnPicker,
  QueryFilterGroup,
  EditFormData,
  QuickEditFormData,
  CustomClasses,
  CustomLabels,
  CustomComponents,
  SetFilterCb,
  SetPaginationCb,
  OnShowFilterEditor,
  ColumnConfigurationWithGroup,
  EditModes,
} from './types';
import { FilterSettings } from '../filter/types';

export interface ColumnContextInterface<T> {
  preMDRColumn?: DataColumn<T>;
  actualColumns: DataColumn<T>[]; // the flat list of columns (lowest level)
  filterColumns: DataColumn<T>[]; // contains actualColumns, but also faux columns defined by separate filters prop
  headerRows: DataColumn<T>[][];
  columnSorts: ColumnSort[];
  groupBy: ColumnSort[]
  filter: QueryFilterGroup,
  filterSettings?: FilterSettings,
  multiColumnSorts: boolean;
  isEditing: boolean;
  isSavingQuickEdit: boolean;
  editData: EditFormData;
  editMode: EditModes;
  canSelectRows: boolean;
  canGroupBy: boolean;
  selectedRows: Record<string | number, T>;
  setFormData: React.Dispatch<React.SetStateAction<EditFormData>>;
  setColumnSort: (newState: ColumnSorts | ((state: ColumnSorts) => ColumnSorts)) => void;
  setAllSelected: (selectAll: boolean) => void;
  setRowSelected: (row: T, rowIndex: number) => void;
  onShowColumnPicker?: OnShowColumnPicker;
  onShowFilterEditor?: OnShowFilterEditor;
  setFilter: SetFilterCb;
  setPagination: SetPaginationCb;
  getRowKey?: (row: T) => string | number
  onSaveQuickEdit: (data: QuickEditFormData<T>) => Promise<void>
  DetailRow?: React.ElementType<{parentRow: T}>
  canRowShowDetail?: (row: T) => boolean
  columnOrder: string[]
  setColumnConfig: (config: ColumnConfigurationWithGroup) => void
  canReorderColumns: boolean
  canSelectRow?: (row: T) => boolean;
  classNames?: CustomClasses
  labels?: CustomLabels
  components?: CustomComponents<T>
  groupsExpandedByDefault: boolean
  doNotUseHTML5Dialog?: boolean
  getTableRowProps?: (row: T) => (DetailedHTMLProps<HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement> | undefined)
  getTableCellProps?: (value: any, row: T, column: DataColumn<T>) => (DetailedHTMLProps<TdHTMLAttributes<HTMLTableCellElement>, HTMLTableCellElement> | undefined)
}

export const ColumnContext = createContext<ColumnContextInterface<any>>({
  actualColumns: [],
  filterColumns: [],
  headerRows: [],
  columnSorts: [],
  groupBy: [],
  filter: {groupOperator: 'and', filters: []},
  multiColumnSorts: false,
  isEditing: false,
  isSavingQuickEdit: false,
  editData: {},
  editMode: 'default',
  canSelectRows: false,
  selectedRows: {},
  setFormData: () => {},
  setColumnSort: () => {},
  setAllSelected: () => {},
  setRowSelected: () => {},
  setFilter: () => {},
  setPagination: () => {},
  onSaveQuickEdit: async () => {},
  columnOrder: [],
  setColumnConfig: () => {},
  canReorderColumns: false,
  canGroupBy: false,
  groupsExpandedByDefault: true,
  getTableRowProps: () => undefined,
  getTableCellProps: () => undefined
});

interface GroupCollapseContextInterface {
  setExpanded: (groupKey: string, expanded: boolean) => void
  collapsedState: Record<string, boolean>
}

export const GroupCollapseContext = createContext<GroupCollapseContextInterface>({
  setExpanded: () => {},
  collapsedState: {}
});