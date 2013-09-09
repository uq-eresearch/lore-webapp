/**
 * @class lore.ore.ui.graphicalEditor Panel that provides the graphical editor for Resource Maps
 * @extends Ext.Panel
 */
lore.ore.ui.graphicalEditor = Ext.extend(Ext.Panel,{ 
   constructor: function (config){
        config = config || {};
        config.autoHeight = true;
        config.autoWidth = true;
        config.bodyStyle = { backgroundColor : 'transparent' };
        // add a menu button to tab  : to make it easier for Mac users to access context menu
        config.menuHandler = "lore.ore.ui.graphicalEditor.coGraph.onContextMenu(0, 0);";
                
        lore.ore.ui.graphicalEditor.superclass.constructor.call(this, config);
        /** Default width of new nodes in graphical editor 
          * @const */
        this.NODE_WIDTH   = 220;
        /** Default height of new nodes in graphical editor 
         * @const */
        this.NODE_HEIGHT  = 170;
        /** Default spacing between new nodes in graphical editor 
         * @const */
        this.NODE_SPACING = 40;
        /** Compact width of new nodes in graphical editor 
         * @const */
        this.COMPACT_NODE_WIDTH   = 180;
        /** Compact height of new nodes in graphical editor 
         * @const */
        this.COMPACT_NODE_HEIGHT  = 30;
        /** Compact spacing between new nodes in graphical editor 
         * @const */
        this.COMPACT_NODE_SPACING = 20;     
        /** Used for layout in graphical editor - Maximum width before nodes are positioned on new row 
         * @const */
        this.ROW_WIDTH    = 400;
        /** Used for layout of new nodes */
        this.dummylayoutx = this.NODE_SPACING;
        /** Used for layout of new nodes */
        this.dummylayouty = this.NODE_SPACING;
         /** Used to lookup figures by their URIs in the graphical editor */
        this.lookup = {};
        
   },
   initComponent: function(config){
	   lore.ore.ui.graphicalEditor.superclass.initComponent.call(this,config); 
   },
   /** bindModel, update listeners */
   bindModel: function(co){
        if (this.model) {
            //panel.removeAll();
            this.model.un("addAggregatedResource", this.onAddResource,this);
            this.model.un("removeAggregatedResource", this.onRemoveResource,this);
        }
        this.model = co;
        //this.loadContent(this.model);
        this.model.on("addAggregatedResource", this.onAddResource, this);
        this.model.on("removeAggregatedResource", this.onRemoveResource, this);
        
   },
   /** Initialize the graphical editor */
   initGraph: function(){
	   try {
		    Ext.getCmp("loreviews").activate("drawingarea");
		    this.dummylayoutx = this.NODE_SPACING;
		    this.dummylayouty = this.NODE_SPACING;
		    this.lookup = {};
		    
		    var coGraph = this.coGraph;
		    if (coGraph) {
		        coGraph.getCommandStack().removeCommandStackEventListener(this); 
		        coGraph.removeSelectionListener(this);
		        coGraph.clear();
		    } else {
		        coGraph = new lore.ore.ui.graph.COGraph(this.id);
		        this.coGraph = coGraph;
		        coGraph.setScrollArea(document.getElementById(this.id).parentNode);
		        
		        // create drop target for dropping new nodes onto editor from the Resource Maps dataview
		        var droptarget = new Ext.dd.DropTarget(this.id, {
		                'ddGroup' : 'coDD',
		                'copy' : false
		        });
		        droptarget.notifyDrop = function(dd, e, data) {		        	
		        	if (data.draggedRecord.data.entryType == lore.constants.BASIC_OBJECT_TYPE) {
	        	    	var xhr = new XMLHttpRequest();                
	        	        xhr.overrideMimeType('text/xml');
	        	        var oThis = this;
	        	        xhr.open("GET", data.draggedRecord.data.uri);
	        	        xhr.onreadystatechange= function(){
	        	            if (xhr.readyState == 4) {
			        	    	var xmldoc = xhr.responseXML;
			                    var result = xmldoc.getElementsByTagNameNS(lore.constants.NAMESPACES["sparql"], "result");
		                    	var graphuri;
		                    	
			                    if (result.length > 0){
			                        for (var i = 0; i < result.length; i++) {
			                        	var s,  g, resource;
			                        	var bindings = result[i].getElementsByTagName('binding');
			                            for (var j = 0; j < bindings.length; j++){  
			                            	attr = bindings[j].getAttribute('name');
			                            	if (attr == 's') {
			                            		s = lore.util.safeGetFirstChildValue(
			                            				bindings[j].getElementsByTagName('uri'));
			                            	} else if (attr == 'g') {
			                            		g = lore.util.safeGetFirstChildValue(
			                            				bindings[j].getElementsByTagName('uri'));
			                            	} else if (attr == 'resource') {
			                            		resource = lore.util.safeGetFirstChildValue(
			                            				bindings[j].getElementsByTagName('uri'));
			                            	}
			                            }
			                        	if (s == resource && data.draggedRecord.data.uri == resource) {
			                        		graphuri = g;
			                        	}
			                        }
			                    }
	
			                	var coGraph = lore.ore.ui.graphicalEditor.coGraph;
			                    lore.ore.reposAdapter.loadCompoundObject(graphuri, function(rdf) {
				        			lore.ore.controller.loadHuNICompoundObject(
				        					data.draggedRecord.data.title, data.draggedRecord.data.uri, rdf, 
				        					(e.xy[0] - coGraph.getAbsoluteX() + coGraph.getScrollLeft()),
				        					(e.xy[1] - coGraph.getAbsoluteY() + coGraph.getScrollTop()));
				                });
	        	            }
	        	        };
	        	        xhr.send(null);     
		        	} else if (data.draggedRecord.data.entryType == lore.constants.HUNI_OBJECT_TYPE) {
		        		var ge = lore.ore.ui.graphicalEditor;
		            	var coGraph = ge.coGraph;
		            	
                 	    var objProps = {
		                    //"rdf:type_0" : lore.constants.BASIC_OBJECT_TYPE,
		                    "dc:title_0" : data.draggedRecord.data.title
		                };
		                if (data.draggedRecord.data.latitude){
		                    objProps["dc:latitude_0"] = data.draggedRecord.data.latitude;
		                }
		                if (data.draggedRecord.data.longitude){
		                    objProps["dc:longitude_0"] = data.draggedRecord.data.longitude;
		                }
	                    if (data.draggedRecord.data.date_begin) {
	                	    objProps["dc:date-begin_0"] = data.draggedRecord.data.date_begin;
	                    }
	                    if (data.draggedRecord.data.date_end) {
	                 	    objProps["dc:date-end_0"] = data.draggedRecord.data.date_end;
	                    }
		            	
		            	var figopts = {
		            		url : data.draggedRecord.data.uri,
		                	x : (e.xy[0] - coGraph.getAbsoluteX() + coGraph.getScrollLeft()),
		                	y : (e.xy[1] - coGraph.getAbsoluteY() + coGraph.getScrollTop()),
		                	h: 60, 
		                	w: 180,
		                	oh: 170, 
		                	//rdftype : lore.constants.BASIC_OBJECT_TYPE,
		                	props : objProps
		            	};
		            	ge.addFigure(figopts);
		        	} else if (data.draggedRecord.data.entryType == lore.constants.COMPOUND_OBJECT_TYPE) {
		        		var ge = lore.ore.ui.graphicalEditor;
		            	var coGraph = ge.coGraph;
		            	var figopts = {
		            		url : data.draggedRecord.data.uri,
		                	x : (e.xy[0] - coGraph.getAbsoluteX() + coGraph.getScrollLeft()),
		                	y : (e.xy[1] - coGraph.getAbsoluteY() + coGraph.getScrollTop()),
		                	props : {
		                    	"rdf:type_0" : lore.constants.RESOURCE_MAP,
		                    	"dc:title_0" : data.draggedRecord.data.title
		                	}
		            	};
		            	ge.addFigure(figopts);
		        	}
		            return true;
		        };
		    }
		    coGraph.addSelectionListener(this);
		    coGraph.getCommandStack().addCommandStackEventListener(this);
		    
		    /*// clear the node properties
		    if (lore.ore.ui.nodegrid) {
		        lore.ore.ui.grid.expand();
		        lore.ore.ui.nodegrid.store.removeAll();
		        lore.ore.ui.nodegrid.collapse();
		        lore.ore.ui.relsgrid.store.removeAll();
		        lore.ore.ui.relsgrid.collapse();
		    }*/
	    } catch (e) {
	        lore.debug.ore("Error in GraphicalEditor: initGraph",e);
	    }
   },
   /**
    * Updates the views when nodes or connections are selected
    * @param {lore.draw2d.Figure} figure ResourceFigure, EntityFigure or Connection that was selected
    */
   onSelectionChanged : function(figure) {
        lore.ore.controller.updateSelection(figure, this);
        if (figure != null) {
            // raise tab first so that properties are rendered and column widths get sized correctly for resource/rels
        	Ext.getCmp("propertytabs").activate("properties");
            if (figure instanceof lore.ore.ui.graph.EntityFigure) {
                if (figure.model){
                    lore.ore.ui.nodegrid.bindModel(figure.model);
                }
                // get connections
                var relationshipsData = [];
                var ports = figure.getPorts(); 
                for (var port = 0; port < ports.getSize(); port++){
                    var connections = ports.get(port).getConnections();
                    for (var j = 0; j < connections.getSize(); j++) {
                        var theconnector = connections.get(j);
                        var dir;
                       
                        var sp = theconnector.sourcePort.parentNode;
                        var tp = theconnector.targetPort.parentNode;
                        if (figure.url == sp.url){
                            dir = "from";
                        } else {
                            // incoming connection
                            dir = "to";
                        }
                        if (theconnector.symmetric) {
                            dir = "with";
                        }
                        var toURI = tp.url;
                        var toTitle = tp.getProperty("dc:title_0") || tp.url;
                        var fromURI = sp.url;
                        var fromTitle = sp.getProperty("dc:title_0") || sp.url;
                        var relpred = theconnector.edgetype;
                        var relns = theconnector.edgens;
                        var relpfx = lore.constants.nsprefix(relns);
                        relationshipsData.push({
                            id: theconnector.id, 
                            relName: relpred, 
                            relNS: relns,
                            relPrefix: relpfx,
                            fromURI: fromURI,
                            fromTitle: fromTitle,
                            toURI: toURI, 
                            direction: dir, 
                            toTitle: toTitle});
                    }
                }
                lore.ore.ui.relsgrid.store.loadData(relationshipsData);
                // Resource and relationships grid will be visible
                lore.ore.ui.nodegrid.expand();
            }
            else if (figure.edgetype) {
                var tp = figure.targetPort.parentNode;
                var sp = figure.sourcePort.parentNode;
                lore.ore.ui.relsgrid.store.loadData([
                   {id: figure.id, 
                    relName: figure.edgetype,
                    relNS: figure.edgens,
                    relPrefix: lore.constants.nsprefix(figure.edgens),
                    toURI: tp.url,
                    toTitle: tp.getProperty("dc:title_0") || tp.url,
                    fromURI: sp.url,
                    fromTitle: sp.getProperty("dc:title_0") || sp.url,
                    direction: ''}
                   
                ]);
                lore.ore.ui.relsgrid.getSelectionModel().selectFirstRow();
                // Connection: only show relationships grid
                lore.ore.ui.nodegrid.store.removeAll();
                //lore.ore.ui.nodegrid.collapse();
               
            }
            //lore.ore.ui.relsgrid.expand();
            //lore.ore.ui.grid.collapse();
        } else {
            //lore.ore.ui.nodegrid.store.removeAll();
            lore.ore.ui.nodegrid.bindModel(null);
            lore.ore.ui.relsgrid.store.removeAll();
            
            // Background selected: only show Resource Map properties
            if (lore.ore.ui.relsgrid.el) {
            	//lore.ore.ui.relsgrid.collapse();
            }
            if (lore.ore.ui.grid.el) {
            	//lore.ore.ui.grid.expand();
            }
            if (lore.ore.ui.nodegrid.el) {
            	//lore.ore.ui.nodegrid.collapse();
            }
            
            // force hide mask (sometimes can still be in place when selection/deselection happens very quickly)
            this.coGraph.hideMask();
        }
   },
   /**
     * Respond to move, delete, undo and redo commands in the graphical editor
     * @param {} event
     */
    stackChanged : function(event) { 
        var details = event.getDetails(); // indicates whether post execute, undo or redo
        var comm = event.getCommand();
        var commList;
        
        if (0!=(details&(lore.draw2d.CommandStack.POST_UNDO))) {
            // command was undone, check whether dirty needs to be reverted
            lore.ore.controller.rollbackDirty();
        } else if (0!=(details&(lore.draw2d.CommandStack.POST_REDO) || 0!=(details&(lore.draw2d.CommandStack.POST_EXECUTE)))){
            lore.ore.controller.setDirty();
        }
        
        // handle a group of commands eg auto layout, multi-select delete etc
        if (comm instanceof lore.draw2d.CommandGroup){
            commList = comm.commands;
        } else {
            commList = [comm];
        }
        for (var i=0; i < commList.length; i++){
            comm = commList[i];
            var comm_fig = comm.figure;
            // don't allow figures to be moved outside bounds of canvas
            if (comm instanceof lore.draw2d.CommandMove && (comm.newX < 0 || comm.newY < 0)) {
                comm.undo();
            }
            
            if (comm_fig instanceof lore.ore.ui.graph.EntityFigure) {
                // reset dummy graph layout position to prevent new nodes being added too far from content
                if (comm instanceof lore.draw2d.CommandMove  && comm.oldX == this.dummylayoutprevx 
                    && comm.oldY == this.dummylayoutprevy) {   
                        this.nextXY(comm.newX, comm.newY, false);
                }
                // remove the url from lookup if node is deleted, add it back if it is undone
                // update address bar add icon to reflect whether current URL is in Resource Map
                if (0!=(details&(lore.draw2d.CommandStack.POST_EXECUTE))) {
                    if (comm instanceof lore.draw2d.CommandDelete) {
                        try{
                            this.model.removeAggregatedResource(comm_fig.url);
                        } catch (x){
                            lore.debug.ore("Error removing aggregated resource",x);
                        }
                        delete this.lookup[comm_fig.url];
                        if (lore.ore.ui.topView && lore.ore.controller.currentURL == comm_fig.url){
                               lore.ore.ui.topView.hideAddIcon(false);
                        }
                    } else if (comm instanceof lore.draw2d.CommandAdd) {
                        if (lore.ore.ui.topView && lore.ore.controller.currentURL == comm_fig.url){
                               lore.ore.ui.topView.hideAddIcon(true);
                        }
                    }
                }
                else if ((0!=(details&(lore.draw2d.CommandStack.POST_UNDO)) && comm instanceof lore.draw2d.CommandDelete)
                    || (0!=(details&(lore.draw2d.CommandStack.POST_REDO)) && comm instanceof lore.draw2d.CommandAdd)) {
                    //  check that URI isn't in resource map (eg another node's resource may have been changed)
                    
                    if (this.lookup[comm_fig.url]){
                        if (comm instanceof lore.draw2d.CommandDelete) {
                            lore.ore.ui.vp.warning("Cannot undo deletion: resource is aleady in Resource Map");
                            comm.redo();
                        } else {
                            lore.ore.ui.vp.warning("Cannot redo addition: resource is aleady in Resource Map");
                            comm.undo();
                        }
                    }
                    this.lookup[comm_fig.url] = comm_fig.getId();
                    if (lore.ore.ui.topView && lore.ore.controller.currentURL == comm_fig.url){
                       lore.ore.ui.topView.hideAddIcon(true);
                    }       
                    this.model.addAggregatedResource(comm_fig.model);
               } 
                 
                else if ((0!=(details&(lore.draw2d.CommandStack.POST_REDO)) && comm instanceof lore.draw2d.CommandDelete)
                 || (0!=(details&(lore.draw2d.CommandStack.POST_UNDO)) && comm instanceof lore.draw2d.CommandAdd)) {
                    try{
                        this.model.removeAggregatedResource(comm_fig.url);
                    } catch (x){
                        lore.debug.ore("Error removing aggregated resource",x);
                    }
                    delete this.lookup[comm_fig.url];
                    if (lore.ore.ui.topView && lore.ore.controller.currentURL == comm_fig.url){
                           lore.ore.ui.topView.hideAddIcon(false);
                    }
                    
                }
            }
        }
   },
   /** returns the figure that is currently selected */
   getSelectedFigure : function (){    
        return this.coGraph.getCurrentSelection();
   },
   /** select a figure that represents a resource, scrolling it into view
     * @param {} theURL
     */
   showResource : function(uri){
        Ext.getCmp("loreviews").activate(this.id);
        var fig = this.lookupFigure(uri);
        if (fig) {
            this.coGraph.setCurrentSelection(fig);
            fig.header.style.backgroundColor="yellow";
            setTimeout(function(theFig) {theFig.header.style.backgroundColor = "";}, 3200, fig);
            this.coGraph.showMask();
            this.coGraph.scrollTo(fig.x, fig.y);
            this.coGraph.hideMask();
        }
   },
   /** Select a figure without activating view or scrolling */
   selectFigure: function(uri){
       var fig = this.lookupFigure(uri);
       this.coGraph.setCurrentSelection(fig);
   },
   /** respond to model event: add figure to represent resource */
   onAddResource : function(res){
     lore.debug.ore("Error in onAddResource",res);
   },
   /** respond to model event: remove figure when resource is removed from Resource Map */
   onRemoveResource : function(res){
     lore.debug.ore("Error in onRemoveResource",res);
   },
   /** load Resource Map from model object into graphical editor */
   loadContent: function(co){
    
   },
   removeFigure : function(uri){
        try{
            var fig = this.lookupFigure(uri);
            this.coGraph.getCommandStack().execute(fig.createCommand(new lore.draw2d.EditPolicy(lore.draw2d.EditPolicy.DELETE)));
        } catch (e){
            lore.debug.ore("Error in removeFigure",e);
        }
   },
   lookupConnection : function(src, pred, target){
        lore.debug.ore("lookupConnection " + src + " " + pred + " " + target);
        // TODO : implement this lookup
   },
   addConnection : function(opts){
        try {
            // try to find a node that the predicate applies to
            var srcfig = this.lookupFigure(opts.subject);
            if (!srcfig) {
                srcfig = lore.ore.ui.graphicalEditor
                        .lookupFigure(lore.util.unescapeHTML(opts.subject
                                .replace('%3C', '<').replace('%3F', '>')));
            }
            if (srcfig) {
                var relresult = lore.util.splitTerm(opts.pred);
                var tgtfig = lore.ore.ui.graphicalEditor.lookupFigure(opts.obj);
                if (tgtfig && (srcfig != tgtfig)) { 
                    // this is a connection
                    var srcPort = srcfig.getPort("output");
                    var tgtPort = tgtfig.getPort("input");
                    if (srcPort && tgtPort) {
                        var c = new lore.draw2d.Connection({
                            sourcePort: srcPort,
                            targetPort: tgtPort,
                            edgens: relresult.ns, 
                            edgetype: relresult.term
                        });
                        this.coGraph.addFigure(c);
                        
                        return c;
                        
                    } else {
                        throw "source or target port not defined";
                    }
                }
            }
        } catch (e) {
            lore.debug.ore("Error creating connection", e);
            delete c;
        }
   },
   /**
    * Add a figure to represent a resource to the graphical editor
    * @param {} theURL
    * @param {} opts The options
    * @return {}
    */
   addFigure : function(opts, compact) {
	   if (!this.model) {
		   lore.ore.controller.createCompoundObject();
	   }
	   try {
        if (!opts.batch && lore.ore.controller.checkReadOnly()){
            return;
        }
        var fig = null;
        var theURL = lore.util.preEncode(opts.url);
        var figRepresentsBasic = false;
        var figRepresentsCO = false;
        var figRepresentsAnno = false;
        opts.props = opts.props || {};
        if (!opts.x){
            opts.x = this.dummylayoutx;
        }
        if (!opts.y){
            opts.y = this.dummylayouty;
        }
        var title = opts.props["dc:title_0"] || opts.props["dcterms:title_0"];
        /*if (!opts.batch && !title){ 
            try{
	            var globalHistory = Components.classes["@mozilla.org/browser/global-history;2"].
	                        getService(Components.interfaces.nsIGlobalHistory2);
	            title  = globalHistory.getPageTitle(Components.classes["@mozilla.org/network/io-service;1"].
                getService(Components.interfaces.nsIIOService).
                newURI(theURL, null, null));
                if (title){
                    opts.props["dc:title_0"] = title;
                }
            } catch (e) {
                lore.debug.ore("Error getting title from history",e);
            }
        }*/
        if (theURL && (theURL == lore.ore.cache.getLoadedCompoundObjectUri())){
            lore.ore.ui.vp.warning("Cannot add Resource Map to itself");
        } else if (theURL && !this.lookup[theURL]) {
            var theProps = opts.props;
            if (opts.format){
                theProps["dc:format_0"] = opts.format;
            }
            if (opts.rdftype){
                theProps["rdf:type_0"] = opts.rdftype;
                if (opts.rdftype == lore.constants.RESOURCE_MAP){
                    figRepresentsCO = true;
                } else if (opts.rdftype.match(lore.constants.NAMESPACES["annotype"]) 
                            || opts.rdftype.match(lore.constants.NAMESPACES["vanno"]) 
                            || opts.rdftype.match(lore.constants.NAMESPACES["annoreply"])){
                    figRepresentsAnno = true;
                } else if (opts.rdftype.match(lore.constants.BASIC_OBJECT_TYPE)) {
                	figRepresentsBasic = true;
                }
            }
            if (!opts.batch){
                // this is a new resource: create corresponding model object 
                var figProps = new lore.ore.model.ResourceProperties();
                for (p in theProps){
                	console.log(p);
                    var pidsplit = p.split(":");
                    var pfx = pidsplit[0];
                    pidsplit = pidsplit[1].split("_");
                    var idx = pidsplit[1];
                    var propname = pidsplit[0];
                    var ns = lore.constants.NAMESPACES[pfx];
                    var propuri = ns + propname;
                    var propData = {
                        id: propuri, 
                        ns: ns, 
                        name: propname, 
                        value: theProps[p], 
                        prefix: pfx,
                        type: "plainstring"
                    };
                    figProps.setProperty(propData,idx);
                }
                this.model.addAggregatedResource({
                        uri: theURL,
                        title: title,
                        representsCO: figRepresentsCO,
                        representsAnno: figRepresentsAnno,
                        representsBasic: figRepresentsBasic,
                        isPlaceholder: opts.placeholder,
                        properties: figProps
                        
                });   
            }
            var resource = this.model.getAggregatedResource(theURL);
            if (!opts.placeholder){
                fig = new lore.ore.ui.graph.ResourceFigure(resource,theURL);
            } else {
                fig = new lore.ore.ui.graph.EntityFigure(resource);
            }
            if (opts.oh) {
               fig.originalHeight = opts.oh;
            }
            if (opts.w && opts.h){
                fig.setDimension(opts.w, opts.h);    
            } 
            if (opts.order){
                fig.orderIndex = opts.order;
            }
            if (opts.hc){
                fig.setHighlightColor(opts.hc);
            }
            if (opts.abstractPreview == 1){
                fig.abstractPreview = true;
            }
            fig.setContent(theURL);
           
            if (opts.batch){
                this.coGraph.addFigure(fig, opts.x, opts.y);
            } else {   
                // adds to undo stack
                this.coGraph.addResourceFigure(fig, opts.x, opts.y);            
            }
            /*var resource = this.model.getAggregatedResource(theURL);
            if  (resource){
                fig.setModel(resource);
            } else {
                lore.debug.ore("Model not found for " + theURL,fig);
            }*/
            this.lookup[theURL] = fig.getId();
        } else {
            lore.ore.ui.vp.warning("Resource is already in the Resource Map: " + theURL);
        }
        if (fig){
            this.nextXY(opts.x, opts.y, compact);
        }
        return fig;
      } catch (ex){
          lore.debug.ore("Error in add Figure",ex);
      }
    },
    /**
     * Get the figure that represents a resource
     * 
     * @param {} theURL The URL of the resource to be represented by the node
     * @return {} The figure representing the resource
     */
   lookupFigure : function(theURL) {
        var figid = this.lookup[theURL];
        return this.coGraph.getDocument().getFigure(figid);
   },
   
    /**
     * Updates variables used for layout
     * @param {} prevx
     * @param {} prevy
     * @param {} compact
     */
    nextXY : function(prevx, prevy, compact) {
        this.dummylayoutprevx = prevx;
        this.dummylayoutprevy = prevy;
        if (compact) {
        	var rw = lore.ore.ui.graphicalEditor.coGraph.canvElem.width - 220;
        	
            if (prevx + this.COMPACT_NODE_WIDTH > rw) {
                this.dummylayoutx = 40;
                this.dummylayouty = prevy + this.COMPACT_NODE_HEIGHT + this.COMPACT_NODE_SPACING;
            } else {
                this.dummylayoutx = prevx + this.COMPACT_NODE_WIDTH + this.COMPACT_NODE_SPACING;
                this.dummylayouty = prevy;
            }
        } else {
            if (prevx + this.NODE_WIDTH > this.ROW_WIDTH) {
                this.dummylayoutx = 40;
                this.dummylayouty = prevy + this.NODE_HEIGHT + this.NODE_SPACING;
            } else {
                this.dummylayoutx = prevx + this.NODE_WIDTH + this.NODE_SPACING;
                this.dummylayouty = prevy;
            }
        	
        }
    }
});
Ext.reg('grapheditor',lore.ore.ui.graphicalEditor);