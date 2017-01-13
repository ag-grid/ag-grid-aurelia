import {
    autoinject, transient, Container, ViewResources, ViewCompiler,
    ViewSlot, DOM, Origin, TemplatingEngine,
    ViewFactory
} from "aurelia-framework";

import {
    ICellRenderer,
    ICellEditor,
    BaseFrameworkFactory,
    IFrameworkFactory,
    IFilter,
    ICellRendererFunc,
    ColDef,
    GridOptions
} from "ag-grid/main";

import {AureliaComponentFactory} from "./aureliaComponentFactory";

export interface IAureliaRendererFramework {
    component?: string|Function;
    template?: string;
    $viewFactory?: ViewFactory;
}

@autoinject()
@transient()
export class AureliaFrameworkFactory implements IFrameworkFactory {
    private _container: Container;
    private _viewResources: ViewResources;
    private _baseFrameworkFactory: IFrameworkFactory = new BaseFrameworkFactory();    // todo - inject this

    constructor(private _componentFactory: AureliaComponentFactory,
                private _viewCompiler: ViewCompiler,
                private templatingEngine: TemplatingEngine) {
    }

    public colDefFloatingCellRenderer(colDef: ColDef): {new(): ICellRenderer} | ICellRendererFunc | string {
        return this._baseFrameworkFactory.colDefFloatingCellRenderer(colDef);
    }

    public getCellRendererViewFactory(colDef: ColDef): Promise<void> {
        return this.populateViewFactory(colDef.cellEditorFramework);
    }
    public colDefCellRenderer(colDef: ColDef): {new(): ICellRenderer} | ICellRendererFunc | string {
        let rendererFramework = colDef.cellRendererFramework;
        //$viewFactory must be created before the grid is initialized
        //because promises are involved.
        if (rendererFramework && (rendererFramework.$viewFactory)) {
            return this._componentFactory.createCellRendererFromViewFactory(this._container,
                                                                            rendererFramework.$viewFactory);
        }
        else {
            return this._baseFrameworkFactory.colDefCellRenderer(colDef);
        }
    }

    public getCellEditorViewFactory(colDef: ColDef): Promise<void> {
        return this.populateViewFactory(colDef.cellEditorFramework);
    }
    public colDefCellEditor(colDef: ColDef): {new(): ICellEditor} | string {
        let rendererFramework = colDef.cellEditorFramework;
        //$viewFactory must be created before the grid is initialized
        //because promises are involved.
        if (rendererFramework && (rendererFramework.$viewFactory)) {
            return this._componentFactory.createEditorFromTemplate(this._container,
                                                                   rendererFramework.$viewFactory);
        }
        else {
            return this._baseFrameworkFactory.colDefCellEditor(colDef);
        }
    }

    public getFullWidthCellRendererViewFactory(gridOptions: GridOptions): Promise<void> {
        return this.populateViewFactory(gridOptions.fullWidthCellRendererFramework);
    }

    public gridOptionsFullWidthCellRenderer(gridOptions: GridOptions): {new(): ICellRenderer} | ICellRendererFunc | string {
        let rendererFramework = gridOptions.fullWidthCellRendererFramework;

        //$viewFactory must be created before the grid is initialized
        //because promises are involved.
        if (rendererFramework && (rendererFramework.$viewFactory)) {
            return this._componentFactory
                       .createCellRendererFromViewFactory(this._container, rendererFramework.$viewFactory);

        }

        return this._baseFrameworkFactory.gridOptionsFullWidthCellRenderer(gridOptions);
    }

    public gridOptionsGroupRowRenderer(gridOptions: GridOptions): {new(): ICellRenderer} | ICellRendererFunc | string {
        return this._baseFrameworkFactory.gridOptionsGroupRowRenderer(gridOptions);
    }

    public gridOptionsGroupRowInnerRenderer(gridOptions: GridOptions): {new(): ICellRenderer} | ICellRendererFunc | string {
        return this._baseFrameworkFactory.gridOptionsGroupRowInnerRenderer(gridOptions);
    }

    public colDefFilter(colDef: ColDef): {new (): IFilter;} | string {
        return this._baseFrameworkFactory.colDefFilter(colDef);
    }

    public setContainer(container: Container): void {
        this._container = container;
    }

    public setViewResources(viewResources: ViewResources): void {
        this._viewResources = viewResources;
    }

    setTimeout(action: any, timeout?: any): number {
        return this._baseFrameworkFactory.setTimeout(action, timeout);
    }

    /**
     * Aurelia returns a promise when creating a viewFactory for a component
     */
    private populateViewFactory(rendererFramework: IAureliaRendererFramework): Promise<void> {
        if (!rendererFramework || (!rendererFramework.template && !rendererFramework.component)) {
            return Promise.resolve();
        }

        if(rendererFramework.template && rendererFramework.component){
            console.warn('Both template and component are present for the Aurelia renderer framework. Using Template');
        }

        if (rendererFramework.template) {
            rendererFramework.$viewFactory = this._viewCompiler.compile(rendererFramework.template,
                                                                        this._viewResources);
            return Promise.resolve();
        }

        if (rendererFramework.component) {
            return this.createViewFactoryFromComponent(rendererFramework.component)
                .then(ViewFactory => {rendererFramework.$viewFactory = ViewFactory});
        }

    }

    private createViewFactoryFromComponent(component: string | Function): Promise<ViewFactory> {
        let host = DOM.createElement('div');

        let viewModel = typeof component === 'function'
            ? Origin.get(component).moduleId
            : component;

        let viewSlot = new ViewSlot(host, true);

        let compositionContext = {
            container: this._container,
            viewModel: viewModel,
            viewSlot: viewSlot,
            viewResources: this._viewResources,
            model: {}
        };

        return this.templatingEngine.compose(<any>compositionContext)
                   .then((controller: any) => {
                       //throw away the view we just compiled
                       //we only want the view factory
                       viewSlot.removeAll(true, true);
                       return controller.view.viewFactory;
                   });
    }

}
