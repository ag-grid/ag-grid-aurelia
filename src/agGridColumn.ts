import {autoinject, child, children, customElement, inlineView} from "aurelia-framework";
import {ColDef} from "ag-grid/main";
import {
    AgCellTemplate,
    AgEditorTemplate,
    AgFilterTemplate,
    AgHeaderGroupTemplate,
    AgHeaderTemplate, AgPinnedRowTemplate
} from "./agTemplate";
import {generateBindables} from "./agUtils";

@customElement('ag-grid-column')
@generateBindables(["colId", "sort", "sortedAt", "sortingOrder", "field", "headerValueGetter", "hideCol", "pinned",
    "tooltipField", "headerTooltip", "valueGetter", "keyCreator",
    "width", "minWidth", "maxWidth", "cellClass", "cellStyle", "cellRenderer", "cellRendererFramework",
    "cellRendererParams", "cellEditor", "cellEditorFramework", "cellEditorParams", "floatingCellRenderer",
    "floatingCellRendererFramework", "floatingCellRendererParams", "cellFormatter(", "floatingCellFormatter",
    "getQuickFilterText", "aggFunc", "rowGroupIndex", "pivotIndex", "comparator", "checkboxSelection", "suppressMenu",
    "suppressSorting", "suppressMovable", "suppressFilter", "unSortIcon", "suppressSizeToFit", "suppressResize",
    "suppressAutoSize", "enableRowGroup", "enablePivot", "enableValue", "editable", "suppressNavigable", "newValueHandler",
    "volatile", "filter", "filterFramework", "filterParams", "cellClassRules", "onCellValueChanged", "onCellClicked",
    "onCellDoubleClicked", "onCellContextMenu", "icons", "enableCellChangeFlash", "headerName", "columnGroupShow",
    "headerClass", "children", "groupId", "openByDefault", "marryChildren", "headerCheckboxSelection",
    "headerCheckboxSelectionFilteredOnly", "type", "tooltipField", "valueSetter", "pinnedRowCellRenderer",
    "pinnedRowCellRendererFramework", "pinnedRowCellRendererParams", "valueFormatter", "pinnedRowValueFormatter",
    "valueParser", "allowedAggFuncs", "rowGroup", "showRowGroup", "pivot", "equals", "pivotComparator", "menuTabs",
    "colSpan", "suppressPaste", "template", "templateUrl", "pivotValueColumn", "pivotTotalColumnIds", "headerComponent",
    "headerComponentFramework", "headerComponentParams", "floatingFilterComponent", "floatingFilterComponentParams",
    "floatingFilterComponentFramework"])
// <slot> is required for @children to work.  https://github.com/aurelia/templating/issues/451#issuecomment-254206622
@inlineView(`<template><slot></slot></template>`)
@autoinject()
export class AgGridColumn {
    private mappedColumnProperties: any = {
        "hideCol": "hide"   // hide exists in aurelia-templating-resources and will conflict
    };

    @children('ag-grid-column')
    public childColumns: AgGridColumn[] = [];

    @child('ag-cell-template')
    public cellTemplate: AgCellTemplate;

    @child('ag-editor-template')
    public editorTemplate: AgEditorTemplate;

    @child('ag-filter-template')
    public filterTemplate: AgFilterTemplate;

    @child('ag-header-template')
    public headerTemplate: AgHeaderTemplate;

    @child('ag-header-group-template')
    public headerGroupTemplate: AgHeaderGroupTemplate;

    @child('ag-pinned-row-template')
    public pinnedRowTemplate: AgPinnedRowTemplate;

    constructor() {
    }

    public hasChildColumns(): boolean {
        return this.childColumns && this.childColumns.length > 0;
    }

    public toColDef(): ColDef {
        let colDef: ColDef = this.createColDefFromGridColumn();

        if (this.hasChildColumns()) {
            (<any>colDef)["children"] = AgGridColumn.getChildColDefs(this.childColumns);
        }

        const defaultAction = (templateName:string) => {
            let self = <any>this;

            if(self[templateName]) {
                const frameworkName = templates[templateName].frameworkName;
                (<any>colDef)[frameworkName] = {template: self[templateName].template};
                delete (<any>colDef)[templateName];
            }
        };

        const templates : any = {
            cellTemplate: {
                frameworkName: 'cellRendererFramework'
            },
            editorTemplate: {
                frameworkName: 'cellEditorFramework'
            },
            filterTemplate: {
                frameworkName: 'filterFramework'
            },
            headerTemplate: {
                frameworkName: 'headerComponentFramework'
            },
            headerGroupTemplate: {
                frameworkName: 'headerGroupComponentFramework'
            },
            pinnedRowTemplate: {
                frameworkName: 'pinnedRowCellRendererFramework'
            }
        };

        const addTemplate = (templateName: string) => {
            const action = templates[templateName].action ? templates[templateName].action : defaultAction;
            action(templateName);
        };

        Object.keys(templates)
            .forEach(addTemplate);

        return colDef;
    }

    private static getChildColDefs(childColumns: AgGridColumn[]) {
        return childColumns
            .filter(column => !column.hasChildColumns())
            .map((column: AgGridColumn) => {
                return column.toColDef();
            });
    };

    private createColDefFromGridColumn(): ColDef {
        let colDef: ColDef = {};
        for (let prop in this) {
            if (typeof (<any>this)[prop] !== "undefined") {
                let colDefProperty = this.mappedColumnProperties[prop] ? this.mappedColumnProperties[prop] : prop;
                (<any>colDef)[colDefProperty] = (<any>this)[prop];
            }
        }
        delete (<any>colDef).childColumns;
        return colDef;
    };
}