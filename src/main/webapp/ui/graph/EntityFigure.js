/**
 * @class lore.ore.ui.graph.EntityFigure Displays a placeholder entity
 * @extends lore.draw2d.Node
 * @param {Object} initprops initial properties
 */
lore.ore.ui.graph.EntityFigure = function(model) {
    this.NOHIGHLIGHT = "FFFFFF";
    this.cornerSize = 15; 
    this.editing = false;
    this.originalHeight = 50; // for backwards compatibility: will load as collapsed ResourceFigure in previous versios
    this.highlightColor = this.NOHIGHLIGHT; 
    lore.draw2d.Node.call(this);
    // Need to set model after call to superclass as it sets model property to null
    this.setModel(model);
    this.url = this.getProperty("resource_0");
    var title = this.getTitle();
    if (!title) {
        title = "";
    }
    this.createTitleField();
    this.displayTitle((title ? title : 'Untitled'));
    this.setDimension(90, 30);
    Ext.get(this.header).on('dblclick',this.startEditing,this);
    Ext.get(this.menuIcon).on("click", this.onHeaderMenu, this);
};
Ext.extend(lore.ore.ui.graph.EntityFigure, lore.draw2d.Node, {
    type : "lore.ore.ui.graph.EntityFigure",
    /**
     * Create the HTML to represent the figure
     * @private
     * @return {}
     */
    createHTMLElement : function() {  
        var item = document.createElement("div");
        Ext.apply(item,{
            id:this.id,
            className : "entity_resource"
        });
        Ext.apply(item.style,{
                position: "absolute",
                left: this.x + "px",
                top : this.y + "px",
                height : this.height + "px",
                width : this.width + "px",
                margin : "0px",
                padding : "0px",
                outlineStyle : "none",
                zIndex : "" + lore.draw2d.Figure.ZOrderBaseIndex
        }); 
        var header = document.createElement("div");
        Ext.apply(header,{
            id: 'a' + this.id + "_header",
            className : "x-unselectable entity-header"
        });
        Ext.apply(header.style,{
            position: "absolute",
            height : (this.cornerSize) + "px"
        });
        Ext.get(header).createChild({
           tag: "div",
           cls: "headerTitle",
           style: "padding-left: 15px"
        });
        this.header = header;
        
        var textarea = document.createElement("div");
        textarea.className = "entity-preview";
        Ext.get(textarea).createChild({
            tag: "span",
            cls: "orelink",
            children: ["(placeholder)"]
        });
        Ext.apply(textarea.style,{
            position: "absolute",
            left : "0px",
            top : this.cornerSize + "px"
        });
        this.textarea = textarea;
        var highlightElement = document.createElement("div");
        Ext.apply(highlightElement.style,{
            position: "absolute",
            left: "-3px",
            top: "-3px"
        });
        this.highlightElement = highlightElement;
        var menuIcon = document.createElement("div");
        Ext.apply(menuIcon.style,{
            position: "absolute",
            left: "3px",
            top: "1px",
            height: (this.cornerSize) + "px"
        });
        Ext.apply(menuIcon,{
            className: "x-unselectable menuIcon",
            title: "Menu"
        });
        Ext.get(menuIcon).createChild({
                tag: "img",
                src: lore.constants.baseUrl + "skin/blank.png"
        });
        this.menuIcon = menuIcon;
        // order in which elements are appended determines z-order
        item.appendChild(highlightElement);
        item.appendChild(textarea);
        item.appendChild(header);
        item.appendChild(menuIcon);
        return item;
    },
    /** Create an editable title field */
    createTitleField : function(){
        this.editField = new Ext.form.TextField({
            width: 200,
            height: this.cornerSize,
            renderTo: this.html,
            hidden: true,
            style: {
                fontSize: "11px",
                fontFamily: "tahoma, arial, helvetica",
                position:"absolute",
                top: "1px",
                left: this.cornerSize,
                zIndex: "inherit"
            }
        }); 
        this.editField.on("specialkey",function(f,e){   
            var key = e.getKey();
            if (e.getKey() == e.ENTER || e.getKey() == e.ESC){
                // cancel edit if escape is pressed
                this.stopEditing(key == e.ESC);
            }
            e.stopPropagation();
        },this);
        this.editField.on("blur",function(f,n,o){
                this.stopEditing();
        },this);
    },
    /** 
     * Stop direct editing of title
     */
    stopEditing : function(cancel){
        try{
        this.workflow.editingText = false;
        this.editing = false;
        if (!cancel && this.editField.isValid()){
            // update title
            var t = this.editField.getRawValue();
            this.setProperty("dc:title_0",t)
        }
        this.editField.hide();
        } catch (ex){
            lore.debug.ore("Error in stop editing",ex)
        }
    },
    /**
     * Start direct editing of relationship
     */
    startEditing : function(){
        try{
            // prevent keystrokes entered into text field being interpreted by editor to move/delete nodes
            this.workflow.editingText = true;
            if (this.editing){
                return;
            }
            this.editing = true;
            // hide display label
            this.displayTitle("");
            // display editing field with current value
            this.editField.setRawValue(this.getProperty("dc:title_0"));
            this.editField.setWidth(this.width - (this.cornerSize * 2));
            this.editField.show();  
            this.editField.focus();     
        } catch (ex){
            lore.debug.ore("Error in startEditing",ex);
        }
    },
    setContent : function(url){
      this.url = url;
    },
    /**
     * Set the dimensions of the figure
     * 
     * @param {number} w Width in pixels
     * @param {number} h Height in pixels
     */
    setDimension : function(w, h) {
        lore.draw2d.Node.prototype.setDimension.call(this, w, h);
        if(this.textarea){
            this.highlightElement.width=(this.width) + "px";
            this.textarea.style.width = (this.width) + "px";
            this.textarea.style.height = (this.height - this.cornerSize) + "px";
            this.header.style.width = (this.width) + "px";
            
        }
        if (this.outputPort) {
            this.outputPort.setPosition(this.width + 2, this.height / 2);
        }
        if (this.inputPort) {
            this.inputPort.setPosition(0, this.height / 2);
        }

        if (this.inputPort2) {
            this.inputPort2.setPosition(this.width / 2, 0);
        }
        if (this.outputPort2) {
            this.outputPort2.setPosition(this.width / 2, this.height + 2);
        }
        
    },
    /**
     * Set the title in the header of the figure
     * 
     * @param {string} title
     */
    displayTitle : function(title) {
        this.header.firstChild.textContent = title;
    },
    getHighlightColor: function(){
      if (this.highlightColor != this.NOHIGHLIGHT){
        return this.highlightColor;
      }
    },
    setHighlightColor: function(color){
        this.highlightColor = color;
        if (color != this.NOHIGHLIGHT){
            this.textarea.style.backgroundColor = "#" + color;
        } else {
            this.textarea.style.backgroundColor = "";
        }
    },
    
    setModel : function(modelObj){
        try{
            var props;
            if (this.model){
                props = this.model.get("properties");
                if (props){
                    props.un("propertyChanged",this.handlePropertyChanged, this);
                    props.un("propertyRemoved", this.handlePropertyRemoved, this);
                }
            }
            this.model = modelObj;
            props = modelObj.get("properties");
            if (props){
                props.on("propertyChanged",this.handlePropertyChanged,this);
                props.on("propertyRemoved", this.handlePropertyRemoved, this);
            }
        } catch (ex){
            lore.debug.ore("Error in setModel:",ex);
        }
    },
   
    /** Bring figure to front, masking all others - for moving, resizing etc */
    raise : function() {
        this.oldZ = this.getZOrder();
        this.setZOrder(10000);
        this.workflow.showMask();
    },
    /** Restore figure and unmask all others */
    lower : function() {
        if (this.oldZ) {
            this.setZOrder(this.oldZ);
            delete this.oldZ;
        }
        this.workflow.hideMask();
    },
    /**
     * Override onDragstart to bring node to front and hide preview while
     * dragging. 
     * 
     * @param {} x
     * @param {} y
     * @return {Boolean}
     */
    onDragstart : function(x, y) {
        this.raise();
        return lore.draw2d.Node.prototype.onDragstart.call(this, x, y);
        
    },
    /** Return the minimum width */
    getMinWidth : function() {
        return 80;
    },
    /** Return the minimum height */
    getMinHeight : function() {
        return 32;
    },
    /**
     * Override onDragend to reset ZOrder and redisplay preview
     */
    onDragend : function() {
        this.lower();
        lore.draw2d.Node.prototype.onDragend.call(this);
    },
    /**
     * 
     * @param {}
     *            flag
     */
    setCanDrag : function(flag) {
        lore.draw2d.Node.prototype.setCanDrag.call(this, flag);
        this.html.style.cursor = "";
        if (!this.header) {
            return;
        }
        if (flag) {
            this.header.style.cursor = "move";
        } else {
            this.header.style.cursor = "";
        }
    },
    /** Hide or show highlighting of node to indicate selection 
     * @param {boolean} highlight
     */
    setSelected : function(highlight) {
        if (highlight) {
            $(this.highlightElement).addClass('highlightEntity');
        } else {
            $(this.highlightElement).removeClass('highlightEntity'); 
        }
    },
    /**
     * 
     * @param {lore.ore.ui.graph.COGraph}  wf The parent lore.draw2d.Workflow object
     */
    setWorkflow : function(wf) {
        lore.draw2d.Node.prototype.setWorkflow.call(this, wf);
        if (this.getZOrder() == lore.draw2d.Figure.ZOrderBaseIndex && wf) {
            this.setZOrder(lore.draw2d.Figure.ZOrderBaseIndex
                    + wf.getDocument().getFigures().getSize());
        }
        if (wf && !this.inputPort) {
            this.inputPort = new lore.draw2d.Port();
            this.inputPort.setWorkflow(wf);
            this.inputPort.setName("input");
            this.addPort(this.inputPort, 0, this.height / 2);

            this.inputPort2 = new lore.draw2d.Port();
            this.inputPort2.setWorkflow(wf);
            this.inputPort2.setName("input2");
            this.addPort(this.inputPort2, this.width / 2, 0);

            this.outputPort = new lore.draw2d.Port();
            this.outputPort.setWorkflow(wf);
            this.outputPort.setName("output");
            this.addPort(this.outputPort, this.width + 2, this.height / 2);

            this.outputPort2 = new lore.draw2d.Port();
            this.outputPort2.setWorkflow(wf);
            this.outputPort2.setName("output2");
            this.addPort(this.outputPort2, this.width / 2, this.height + 2);

        }
        this.draggable.removeEventListener("dragstart", this.tmpDragstart);
        // override dragstart to not select figure (we do this by default in
        // setCurrentSelection
        this.tmpDragstart = function(oEvent) {
            var obj = oEvent.target.node;
           
            var w = obj.workflow;
            w.showMenu(null);
            w.setCurrentSelection(obj);
            oEvent.returnValue = obj.onDragstart(oEvent.x, oEvent.y);
        };
       
       this.draggable.addEventListener("dragstart",this.tmpDragstart);  
    },
    
    /**
     * Append a property to the properties
     * 
     * @param {} pname The name of the property to append eg dc:title
     * @param {}  pval The value of the property
     * @param {} ptype optional property type
     */
    appendProperty : function(pname, pval,ptype) {
        var counter = 0;
        var prop = this.getProperty(pname + "_" + counter);
        while (prop) {
            counter = counter + 1;
            prop = this.getProperty(pname + "_" + counter);
        }
        this.setProperty(pname + "_" + counter, pval,ptype);
    },
    /**
     * Set (or add) a property with a specific id
     * 
     * @param {}  pid The id of the property eg dc:title_0
     * @param {} pval The value of the property
     * @param {} type Optional datatype for the property eg string
     */
    setProperty : function(pid, pval,type) {
        if (!this.model) {
            lore.debug.ore("Error: no model for fig " + this.url,this);
        }
        var oldval = this.getProperty(pid);
        if ((pid == "dc:title_0" || pid == "dcterms:title_0")){
            // Always redisplay title as it may have been cleared during editing    
            if (pval && pval != "") {
                this.displayTitle(pval);
            } else {
                this.displayTitle("Resource");
            }
            // only update model if value has changed
            if (this.model && pval != oldval){
                this.model.set('title',pval);
                this.model.commit();
            } 
        } else if (pid == "dc:type_0"){
           // override icon
           this.setIcon(pval);
        }
        // Update model property
        if (pid != "resource_0" && this.model && pval != oldval){
            try{
                var pidsplit = pid.split(":");
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
                    value: pval, 
                    prefix: pfx
                };
                if (type){
                    propData.type = type;
                }
                this.model.get('properties').setProperty(propData,idx)
            } catch (ex){
                lore.debug.ore("Error in setProperty",ex);
            }
        }
    },
    /**
     * Unset (remove) a property by id
     * 
     * @param {} pid The id of the property eg dc:title_0
     */
    unsetProperty : function(pid, updateModel) {
        if (pid == "dc:title_0" || pid == "dcterms:title_0") {
            var existingTitle = this.getProperty("dc:title_0")
                    || this.getProperty("dcterms:title_0");
            if (existingTitle) {
                this.displayTitle(existingTitle);
            } else {
                this.displayTitle("Resource");
            }
        }
        if (pid == "dc:type_0"){
            this.setIcon();
        }
        // Update model
        var propData = this.expandPropAbbrev(pid);
        if (updateModel && propData && propData.id){
            this.model.get('properties').removeProperty(propData.id, propData.index);
        }
    },
    /** Update layout related properties in model */
    persistLayout : function(){
        // orderIndex and isPlaceholder are managed and persisted by the CompoundObject
        if (this.abstractPreview){
            this.setProperty("layout:abstractPreview_0",1);
        } else {
            this.unsetProperty("layout:abstractPreview_0", true);
        }
        this.setProperty("layout:height_0",this.height);
        this.setProperty("layout:originalHeight_0", this.originalHeight);
        this.setProperty("layout:width_0", this.width);
        this.setProperty("layout:x_0", this.x);
        this.setProperty("layout:y_0", this.y)
        if (this.highlightColor){
            this.setProperty("layout:highlightColor_0",this.highlightColor);
        } else {
            this.unsetProperty("layout:highlightColor_0",true);
        }
    },
    /** Return the title of the figure */
    getTitle : function(){
        return this.getProperty("dc:title_0") || this.getProperty("dcterms:title_0");
    },
    /**
     * Get a property value
     * 
     * @param {string}   pid Fully qualified property index eg dc:format_0
     * @return {} the property value
     */
    getProperty : function(pid) {
        if (!this.model){
            lore.debug.ore("Error: no model for fig");
            return;
        }
        var expandPid = this.expandPropAbbrev(pid);
        var theProp = this.model.get('properties').getProperty(expandPid.id, expandPid.index);
        if (theProp){
            if (pid.match("dc:subject")){
                // make sure that subject terms don't still have escaped ampersands in them
                 return theProp.value.toString().replace(/&amp;/g,'&');
            } else {
                if (theProp.value){
                    return theProp.value.toString();
                } else {
                    lore.debug.ore("getProperty no value" + pid);
                }
            }
        }
    },
    getPropertyType : function(pid){
        try{
            var propData = this.expandPropAbbrev(pid);
            if (this.model){
                var ptype = this.model.get('properties').getProperty(propData.id, propData.index).type;     
                if (ptype){
                    return ptype;
                } 
            } else {
                lore.debug.ore("getPropertyType: no model for fig " + this.url + " " + pid,this);
            }
        } catch (ex){
            lore.debug.ore("Error in getPropertyType",ex);
        
        }
        return "plainstring";
    },
    handlePropertyChanged: function(propData,index){
        if (propData && propData.id == lore.constants.NAMESPACES["layout"] + "highlightColor"){
            this.setHighlightColor(propData.value);
        }
    },
    handlePropertyRemoved: function(propData, index){
        if (propData){
            this.unsetProperty(propData.prefix + ":" + propData.name + "_" + index, false);
        }
    },
    /** Show context menu underneath menuIcon in header */
    onHeaderMenu : function(event){ 
        var w = this.workflow;
        var xy = event.getXY();
        var absx = xy[0] - w.getAbsoluteX() + w.getScrollLeft();
        var absy = xy[1] - w.getAbsoluteY() + w.getScrollTop();
        this.onContextMenu(absx,absy);
    },
    /** 
     * Generate entries for context menu
     */
    populateContextMenu : function(menu){
          /*menu.add({
                text: "Delete resource from Resource Map",
                icon: lore.constants.baseUrl + "skin/icons/delete.png",
                scope: this,
                handler: function(evt){
                    this.workflow.getCommandStack()
                        .execute(this.createCommand(
                                new lore.draw2d.EditPolicy(lore.draw2d.EditPolicy.DELETE)));
                }
          });*/
          menu.add("-");
          menu.add({
                text: "Show in Resource List",
                icon: lore.constants.baseUrl + "skin/icons/ore/table_edit.png",
                scope: this,
                handler: function(evt){
                    Ext.getCmp("loreviews").activate("remlistview");
                    Ext.getCmp("remlistview").selectResource(this.url);
                }
          });
          menu.add({
                text: "Show in Details view",
                icon: lore.constants.baseUrl + "skin/icons/ore/application_view_detail.png",
                scope: this,
                handler: function(evt){
                    Ext.getCmp("loreviews").activate("remdetailsview");
                    Ext.getCmp("remdetailsview").scrollToResource(this.url);                
                }
          });
          menu.add({
                text: "Show in Slideshow view",
                icon: lore.constants.baseUrl + "skin/icons/ore/picture_empty.png",
                scope: this,
                handler: function(evt){     
                    Ext.getCmp("newss").showResource(this.url);
                }
           });
           menu.add({
                text: "Show in Explore view",
                icon: lore.constants.baseUrl + "skin/icons/ore/network.png",
                scope: this,
                handler: function(evt){
                    this.contextmenu.hide();
                    Ext.getCmp("loreviews").activate("remexploreview");
                    var rdftype = this.getProperty("rdf:type_0");
                    var isCO = (rdftype && rdftype.match("ResourceMap"));
                    var title = this.getTitle();
                    if (!title) {
                        title = this.url;
                    }
                    lore.ore.explorePanel.showInExploreView(this.url, title, isCO);
                }
            });
            
            menu.add("-");
            menu.add(
                new Ext.ColorPalette({
                    id: this.id + "_palette",
                    value: this.highlightColor,
                    style: {
                      height: '15px',
                      width: '130px'
                    },
                    colors: [this.NOHIGHLIGHT, "FFFF99","CCFFCC","DBEBFF","EFD7FF","FFE5B4","FFDBFB"],
                    handler: function(cp,color){
                    	try{
                            lore.debug.ore("setting hc from " + this.highlightColor + " to " + color)
	                        var propData = {
	                            id: lore.constants.NAMESPACES["layout"] + "highlightColor", 
	                            ns: lore.constants.NAMESPACES["layout"],
	                            name: "highlightColor", 
	                            value: color, 
	                            prefix: "layout"
	                        };
	                        if (this.highlightColor != color){
	                            this.model.get('properties').setProperty(propData,0);
	                            lore.ore.controller.setDirty();
	                            this.setHighlightColor(color);
	                        }
	                        this.contextmenu.hide();
                        } catch (ex){
                            lore.debug.ore("Error setting highlight color",ex);
                        }
                    },
                    scope: this
                    
                })
            );
    },
    /**
     * Show a context menu for the figure
     * 
     */
    onContextMenu : function(x, y) {
        var w = this.workflow;
        if (!this.contextmenu) {
            this.contextmenu = new Ext.menu.Menu({
                showSeparator: false
            });
            this.populateContextMenu(this.contextmenu);
            
        } else {
            var cp = Ext.getCmp(this.id + "_palette");
            cp.select(this.highlightColor,true);
        }
        var absx = w.getAbsoluteX() +  x - w.getScrollLeft();
        var absy = w.getAbsoluteY() +  y - w.getScrollTop();
        this.contextmenu.showAt([absx, absy]);
        w.setCurrentSelection(this, false);
         
    },
    setCanvas: function(c){
      this.canvas = c;
      for (var i = 0; i < this.ports.getSize(); i++) {
        this.ports.get(i).setCanvas(c);
      }  
    },
    /**
     * Override onKeyDown - workflow will manage this
     * 
     * @param {} keyCode
     * @param {}   ctrl
     */
    onKeyDown : function(keyCode, ctrl) {
        this.workflow.onKeyDown(keyCode, ctrl);
    },
     /** expand prop in form of dc:title_0 to propuri plus index */
    expandPropAbbrev : function(pid){
        if (pid){
            var idx, propname;
            var pidsplit = pid.split(":");
            var pfx = pidsplit[0];
            if (pidsplit[1]){
                pidsplit = pidsplit[1].split("_");
                idx = pidsplit[1] || "0";
                propname = pidsplit[0];
            } 
            var ns = lore.constants.NAMESPACES[pfx];
            var propuri = ns + propname;
            return {id: propuri, name: propname, ns: ns, prefix: pfx, index: idx};
        }
    },
    /**
     * Displays an icon depending on the mimetype of the resource
     */
    setIcon : function(overrideType) { 
        /*var typeTitle = overrideType;
        this.icontype = lore.ore.controller.lookupIcon(overrideType,true);
        var icon = $('#a' + this.id + "-icon" ,this.metadataarea);
        if (icon) {
           icon.removeClass().addClass('mimeicon').addClass(this.icontype).attr('title',typeTitle);
        } */
    },
    
});
