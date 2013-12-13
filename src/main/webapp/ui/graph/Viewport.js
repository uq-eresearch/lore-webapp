// Override Viewport to allow manual resize (for generating images) 
Ext.override(Ext.Viewport, {
    initComponent : function() {
        Ext.Viewport.superclass.initComponent.call(this);
        document.getElementsByTagName('html')[0].className += ' x-viewport';
        this.el = Ext.getBody();
        this.el.setHeight = Ext.emptyFn;
        this.el.setWidth = Ext.emptyFn;
        this.el.dom.scroll = 'no';
        this.allowDomMove = false;
        Ext.EventManager.onWindowResize(this.fireResize, this);
        this.renderTo = this.el;
    },
    syncSize : function(){
        delete this.lastSize;
        this.el.dom.style.height="100%";
        this.el.dom.style.width="auto";
        return this;
    }
});
/**
 * @class lore.ore.ui.Viewport The LORE Resource Maps UI (except for toolbar, status icon etc which are in the overlay)
 * @extends Ext.Viewport
 */
lore.ore.ui.Viewport = Ext.extend(Ext.Viewport, {
    // TODO: implement singleton pattern
    layout : "border",
    border : false,
    initComponent : function() {
        this.items = [{
            region : "center",
            border : false,
            layout : "fit",
            id : "loreviews-container",
            items : [{
                xtype : "tabpanel",
                id : "loreviews",
                /**
                 * Override itemTpl so that we can create menu buttons on the tabs
                 */
                itemTpl: new Ext.XTemplate(
                    '<li class="{cls}" id="{id}"><a class="x-tab-strip-close"></a>',
                    '<tpl if="menuHandler">',
                        '<a title="{text} Menu" href="javascript:void(0);" onclick="{menuHandler}" class="x-tab-strip-menu"></a>',
                    '</tpl>',
                    '<a class="x-tab-right" href="javascript:void(0);"><em class="x-tab-left">',
                    '<span class="x-tab-strip-inner"><span class="x-tab-strip-text {iconCls}">{text}</span></span>',
                    '</em></a>',
                    '</li>'
                ),
                /** 
                 * Override to allow menuHandler to be passed in as config
                 */
                getTemplateArgs: function(item) {
                    var result = Ext.TabPanel.prototype.getTemplateArgs.call(this, item);
                    if (item.menuHandler){
                        result.cls = result.cls + " x-tab-strip-with-menu";
                    }
                    return Ext.apply(result, {
                        closable: item.closable,
                        menuHandler: item.menuHandler
                    });
                },
                /** Override to allow mouse clicks on menu button */
                onStripMouseDown: function(e){
                    var menu = e.getTarget('.x-tab-strip-active a.x-tab-strip-menu', this.strip);
                    if (menu || e.button !== 0){
                        // default onclick behaviour will result
                        return;
                    }
                    e.preventDefault();
                    var t = this.findTargets(e);
                    if(t.close){
                        if (t.item.fireEvent('beforeclose', t.item) !== false) {
                            t.item.fireEvent('close', t.item);
                            this.remove(t.item);
                        }
                        return;
                    }
                    if(t.item && t.item != this.activeTab){
                        this.setActiveTab(t.item);
                    }
                },
                enableTabScroll : true,
                // Ext plugin to change hideMode to ensure tab contents are not reloaded
                plugins : new Ext.ux.plugin.VisibilityMode({
                            hideMode : 'nosize',
                            bubble : false
                }),
                deferredRender : false,
                autoScroll : true,
                items : [{
                            title : "Graphical Editor",
                            tabTip: "View or edit the Resource Map graphically",
                            id : "drawingarea",
                            xtype : "grapheditor",
                            iconCls: "graph-icon"
                        },{
                            title : "Resource List",
                            tabTip: "View or edit the list of resources in the Resource Map",
                            xtype : "resourcepanel",
                            id : "remlistview",
                            iconCls: "list-icon"
                        },  {
                            title : "Details",
                            id: "remdetailsview",
                            tabTip: "View detailed description of Resource Map contents including properties and relationships",
                            xtype: "detailspanel",
                            iconCls: "detail-icon"
                        }, {
                            layout : 'fit',
                            id : "remslideview",
                            title : "Slideshow",
                            iconCls: "slide-icon",
                            tabTip: "View Resource Map contents as a slideshow",
                            items : [{
                                        id : 'newss',
                                        xtype : "slideshowpanel",
                                        autoScroll : true
                                    }]
                        }, {
                            title : "Explore",
                            tabTip: "Discover related resources from the repository",
                            id : "remexploreview",
                            xtype : "explorepanel",
                            iconCls: "explore-icon"
                    }   , {
                            title : "Using Resource Maps",
                            tabTip: "View LORE documentation",
                            id : "welcome",
                            scale: 0.90,
                            autoWidth : true,
                            autoScroll : true,
                            iconCls : "welcome-icon",
                            html : "<iframe id='about_co' type='content' style='border:none' height='100%' width='100%' src='about_compound_objects.html'></iframe>",
                            menuHandler: "Ext.getCmp('welcome').onTabMenu(event);",
                            onTabMenu : function(e){
                                var el = Ext.get(e.explicitOriginalTarget);
                                var xy = el.getAnchorXY();
                                xy[1] = xy[1] + 22; // adjust for height of tab
                                if (!this.contextmenu) {
                                    this.contextmenu = new Ext.menu.Menu({
                                        id : this.id + "-context-menu",
                                        showSeparator: false
                                    });
                                   this.contextmenu.add({
                                        text: "Zoom out",
                                        icon: lore.constants.baseUrl + "skin/icons/ore/magnifier-zoom-out.png",
                                        scope: this,
                                        handler: function(b){
                                            if (this.scale >= 0.3) {this.scale = this.scale - 0.2}; 
                                            var body = Ext.get("about_co").dom.contentWindow.document.body
                                            Ext.get(body).applyStyles("font-size:" + (this.scale * 100) + "%");
                                        }
                                    });
                                    this.contextmenu.add({
                                        text: "Zoom in",
                                        icon: lore.constants.baseUrl + "skin/icons/ore/magnifier-zoom-in.png",
                                        scope: this,
                                        handler: function(b){ 
                                            if (this.scale <  2.0) {this.scale = this.scale + 0.2};
                                            var body = Ext.get("about_co").dom.contentWindow.document.body
                                            Ext.get(body).applyStyles("font-size:" + (this.scale * 100) + "%");
                                        }
                                    });
                                    this.contextmenu.add({
                                        text: "Reset Zoom",
                                        icon: lore.constants.baseUrl + "skin/icons/ore/ore/magnifier-zoom-actual.png",
                                        scope: this,
                                        handler: function(b){
                                            if (lore.ore.controller.high_contrast){
                                                this.scale = 1.2;
                                            } else {
                                                this.scale = 1.0;
                                            }
                                             var body = Ext.get("about_co").dom.contentWindow.document.body
                                             Ext.get(body).applyStyles("font-size:small");
                                        }
                                    });    
                                }
                                this.contextmenu.showAt(xy);
                            }
                        }]
            }]
        }, {
            region : "south",
            height : 25,
            xtype : "statusbar",
            id : "lorestatus",
            defaultText : "",
            autoClear : 6000,
            items: [
                '-',
                {
                    xtype:'label',
                    id:'currentCOMsg', 
                    text: 'New Resource Map'
                },
                ' ',
                {
                    xtype: 'label',
                    id:'currentCOSavedMsg',
                    text:'',
                    style: 'color:red'
                },
                ' ',
                {
                    xtype: 'button',
                    hidden: true,
                    id: 'lockButton',
                    icon: lore.constants.baseUrl + 'skin/icons/ore/lock.png',
                    tooltip: 'Resource Map is locked',
                    scope: lore.ore.controller
                }
            ]
        }, {
            region : "west",
            width : 280,
            split : true,
            animCollapse : false,
            collapseMode : 'mini',
            useSplitTips: true,
            id : "propertytabs",
            xtype : "tabpanel",
            // Override collapse behaviour to improve UI responsiveness
            onCollapseClick: function(e,args,arg2,arg3,arg4){
                var activetab = Ext.getCmp("loreviews").getActiveTab();
                activetab.hide();
                Ext.layout.BorderLayout.SplitRegion.prototype.onCollapseClick.apply(this,arguments);
                activetab.show();
            },
            onExpandClick : function (e){
                var activetab = Ext.getCmp("loreviews").getActiveTab();
                activetab.hide();
                Ext.layout.BorderLayout.SplitRegion.prototype.onExpandClick.apply(this,arguments);
                activetab.show();
            },
            onSplitMove : function (split, newSize){
                var activetab = Ext.getCmp("loreviews").getActiveTab();
                var propactivetab = Ext.getCmp("propertytabs").getActiveTab();
                activetab.hide();
                Ext.layout.BorderLayout.SplitRegion.prototype.onSplitMove.apply(this, arguments);
                activetab.show();
                return false;
            },
            deferredRender : false,
            enableTabScroll : true,
            defaults : {
                autoScroll : true
            },
            fitToFrame : true,
            items : [{
                        "xtype": "panel",
                        layout: "anchor",
                        "title": "Browse",
                        tabTip: "Browse related Resource Maps",
                        "id": "browsePanel",
                        tbar: {
                                "xtype": "lore.paging",
                                "store": "browse",
                                "id": "bpager",
                                items: [
                                    '->',
                                    {
                                       xtype:'button',
                                       icon: lore.constants.baseUrl + "skin/icons/feed.png",
                                       tooltip: "Show feed",
                                       handler: function(){
                                           try{
                                            if (lore.ore.reposAdapter && lore.ore.reposAdapter instanceof lore.ore.repos.RestAdapter){
                                                 var queryURL = lore.ore.reposAdapter.reposURL + "feed?refersTo=" + lore.ore.controller.currentURL.replace(/&/g,'%26');
                                                 lore.util.launchTab(queryURL,window);
                                            } else {
                                                 lore.ore.ui.vp.info("Feeds only supported for lorestore: please update your repository preferences.");
                                            }
                                           } catch (ex){
                                            lore.debug.ore("Error in Viewport: launching feed",ex);
                                           }
                                       }
                                    }
                                ]
                            },
                        items: [
                            {
                                "xtype": "codataview",
                                "store": "browse",
                                "id": "cobview"
                            }
                        ]
                     },
                     {
                            title: "History",
                            tabTip: "List recently viewed Resource Maps",
                            id: "historyPanel",
                            xtype: "panel",
                            anchor: "100% 50%",
                            "tbar": {
                                "xtype": "lore.paging",
                                "store": "history",
                                "id": "hpager"
                           
                            },
                        items: [{
                            "xtype": "codataview",
                            "store": "history",
                            "id": "cohview"
                        }]
                    },
                    {
                        xtype: "searchpanel",
                        id : "searchpanel"
                    }, {
                        xtype : "panel",
                        layout : "anchor",
                        title : "Properties",
                        tabTip: "View or edit Resource Map properties",
                        id : "properties",
                        items : [{
                                    title : 'Resource Map Properties',
                                    id : "remgrid",
                                    propertyType: "property",
                                    xtype : "propertyeditor"
                                }, {
                                    title : "Resource Properties",
                                    id : "nodegrid",
                                    propertyType: "property",
                                    xtype : "propertyeditor"
                                }, {
                                    title: "Relationships",
                                    id: "relsgrid",
                                    propertyType: "relationship",
                                    xtype: "relationshipeditor"
                                }
                                ]
                    }]
        }];
        
        lore.ore.ui.Viewport.superclass.initComponent.call(this);
        
        var loreviews = Ext.getCmp("loreviews");
        loreviews.on("beforeremove", this.closeView, this);
        
        // create a context menu to hide/show optional views
        loreviews.contextmenu = new Ext.menu.Menu({
                    id : "co-context-menu"
        });
        
        /* disable SMIL view for now
         * loreviews.contextmenu.add({
                    text : "Show SMIL View",
                    handler : function() {
                        lore.ore.ui.vp.openView("remsmilview", "SMIL", this.updateSMILView);
                    }
        });*/
        loreviews.contextmenu.add({
            text : "Show RDF/XML",
            handler : function() {
                lore.ore.ui.vp.openView("remrdfview", "RDF/XML",this.updateRDFXMLView);
            },
            scope: this
        });
        loreviews.contextmenu.add({
            text : "Show TriG",
            handler : function() {
                lore.ore.ui.vp.openView("remtrigview", "TriG", this.updateTrigView);
            },
            scope: this
        });
        /*loreviews.contextmenu.add({
            text : "Show JSON",
            handler : function() {
                lore.ore.ui.vp.openView("remjsonview", "JSON", this.updateJSONView);
            },
            scope: this
        });*/
        loreviews.on("contextmenu", function(tabpanel, tab, e) {
                    Ext.getCmp("loreviews").contextmenu.showAt(e.xy);
        });
        // make sure Using Resource Maps has correct stylesheet
        Ext.getCmp("welcome").on("activate",
            function(comp){
                var aboutco= Ext.get("about_co");
                if (aboutco && typeof lore.ore.controller.high_contrast != "undefined") {
                    lore.util.setHighContrast(aboutco.dom.contentWindow, lore.ore.controller.high_contrast);
                } 
             }
        );
    },
    /** @private Create a Resource Map view displayed in a closeable tab */
    openView : function (/*String*/panelid,/*String*/paneltitle,/*function*/activationhandler){
        var tab = Ext.getCmp(panelid);
        if (!tab) {
           tab = Ext.getCmp("loreviews").add({
                'title' : paneltitle,
                'id' : panelid,
                'autoScroll' : true,
                'closable' : true
            });
            tab.on("activate", activationhandler, this);
        }
        tab.show();
    },
    /**
     * @private Remove listeners and reference to a Resource Map view if it is closed
     * 
     * @param {Object} tabpanel
     * @param {Object} panel
     */
    closeView : function(/*Ext.TabPanel*/tabpanel, /*Ext.panel*/panel) {
        // remove listeners
        var tab = Ext.getCmp(panel.id);
        if (panel.id == 'remrdfview') {
            tab.un("activate", this.updateRDFXMLView);     
        } else if (panel.id == 'remsmilview') {
            tab.un("activate", this.updateSMILView);   
        } else if (panel.id == 'remtrigview') {
            tab.un("activate",this.updateTriGView);
        } else if (panel.id == 'remjsonview'){
            tab.un("activate",this.updateJSONView);
        }
        return true;
    },
    /** @private Render the current Resource Map in TriG format in the TriG view*/
    updateTrigView: function(){
        var trig = lore.ore.cache.getLoadedCompoundObject().serialize('trig');
        Ext.getCmp("remtrigview").body.update("<pre style='white-space:pre-wrap;'>" 
            + Ext.util.Format.htmlEncode(trig) + "</pre>");
    },
    /** @private Render the current Resource Map in JSON format in the JSON view*/
    updateJSONView: function(){
        var json = lore.ore.cache.getLoadedCompoundObject().serialize('json');
        Ext.getCmp("remjsonview").body.update("<pre style='white-space:pre-wrap;'>" 
            + Ext.util.Format.htmlEncode(json) + "</pre>");
    },
    /** @private Render the current Resource Map as RDF/XML in the RDF view */
    updateRDFXMLView : function() {
        var rdfXML = lore.ore.cache.getLoadedCompoundObject().serialize('rdf');
        lore.util.transformXML({ 
            stylesheetURL: "./compound_objects/stylesheets/XMLPrettyPrint.xsl",
            theXML: rdfXML,
            window: window,
            serialize: true,
            callback: function(rdfString){
                if (!rdfString) {
                    rdfString = "Unable to generate RDF/XML";
                }
                Ext.getCmp("remrdfview").body.update(rdfString);
            }
        });
    },
    
    /** Display an error message to the user
     * @param {String} message The message to display */
    error : function(/*String*/message){
        var statusopts = {
                'text': message,
                'iconCls': 'error-icon',
                'clear': {
                    'wait': 3000
                }
        };
        lore.ore.ui.status.setStatus(statusopts);
    },
    /**
     * Display an information message to the user
     * @param {String} message The message to display
     */
    info : function(/*String*/message) {
        var statusopts = {
                    'text': message,
                    'iconCls': 'info-icon',
                    'clear': {
                        'wait': 3000
                    }
        };
        lore.ore.ui.status.setStatus(statusopts);
    },
    /**
     * Display a warning message to the user
     * @param {String} message The message to display
     */
    warning : function(/*String*/message){
        var statusopts = {
            'text': message,
            'iconCls': 'warning-icon',
            'clear': {
                'wait': 3000
            }
        };
        lore.ore.ui.status.setStatus(statusopts);
    },
    /**
     * Display a progress message (with loading icon) to the user
     * @param {} message The message to display
     */
    progress : function(message){
        var statusopts = {
            'text': message,
            'iconCls': 'loading-icon',
            'clear': false
        };
        lore.ore.ui.status.setStatus(statusopts);
    }
});