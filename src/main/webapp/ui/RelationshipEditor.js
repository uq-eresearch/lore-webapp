/** 
 * @class RelationshipEditor Grid-based editor for resource relationships
 * @extends Ext.grid.EditorGridPanel
 */
lore.ore.ui.RelationshipEditor = Ext.extend(Ext.grid.EditorGridPanel,{ 
    initComponent: function(config){
        Ext.apply(this, { 
            clicksToEdit : 1,
            columnLines : true,
            autoHeight : true,
            autoWidth: true,
            minColumnWidth: 10,
            collapsible : true,
            collapseFirst: false,
            animCollapse : false,
            // Pop up editor for editing relationship
            relEditorWindow: new Ext.Window({
                modal: true,
                closable: false,
                layout: 'fit',
                animateTarget: 'properties',
                editField: function(tfield,row){
                    try {
	                    this.triggerField = tfield;
	                    this.activeRow = row;
	                    var val = tfield.getValue();
	                    this.show(); 
	                    this.focus();
                    } catch (e){
                        lore.debug.ore("Error in editField",e);
                    }
                },
                items: [],
                bbar: [
                    '->',
                    {
                        xtype: 'button',
                        tooltip: 'Update the relationship value and close editor',
                        text: 'Update',
                        scope: this, // the panel
                        handler: function(btn, ev){
                            try{
                                var w = this.relEditorWindow;
                                //var ta = w.getComponent(0);
                                // need to start/stop editing to trigger to update model
                                this.startEditing(w.activeRow,1);
                                //w.triggerField.setValue(ta.getRawValue());
                                this.stopEditing();
                                
                                w.hide();
                            } catch (e){
                                lore.debug.ore("Error in update",e);
                            }
                        }
                    },
                    {
                        xtype: 'button', 
                        tooltip: 'Cancel edits and close editor',
                        text: 'Cancel',
                        scope: this, // the panel
                        handler: function(btn, ev){
                            try{
                                var w = this.relEditorWindow;
                                w.hide();
                            } catch (e){
                                lore.debug.ore("Error in cancel",e);
                            }
                        }
                    }
                ]
            }),
           
            store : new Ext.data.JsonStore({
                idProperty : 'id',
                fields : [
                    {
                        name : 'id',
                        type : 'string'
                    }, {
                        name : 'relName',
                        type : 'string'
                    }, {
                        name: 'relNS'
                    }, {
                        name: 'relPrefix'
                    }, {
                        name : 'fromURI'
                    }, {
                        name: 'fromTitle',
                        type: 'string'
                    },{ 
                        name: 'direction'
                    }, {
                        name: 'toURI'
                    }, {
                        name: 'toTitle',
                        type: 'string'
                    }
                    
                ]
            }),
            colModel : new Ext.grid.ColumnModel({
                // override to prevent editing when Resource Map is readonly
                getCellEditor: function(colIndex, rowIndex){
                   if (lore.ore.controller.checkReadOnly()){
                        return;
                   }
                   // use the default Trigger Editor (with popup option)
                   return Ext.grid.ColumnModel.prototype.getCellEditor.call(this,colIndex, rowIndex);
                },
                columns : [
                 {
                           header: '',
                           menuDisabled: true,
                           sortable : true,
                           dataIndex : 'direction',
                           width: 20,
                           fixed: true,
                           renderer: function(value, metaData, record, rowIndex, colIndex, store) {
                             metaData.css = "rel-" + value;
                             metaData.attr = value? "title='relationship " + value + " this resource'": "";
                             return "";
                           }
                 },
                 {
                            header : 'From',
                            dataIndex : 'fromTitle',
                            menuDisabled : true
                 },
                 {
                            header : 'Rel.',
                            sortable : true,
                            dataIndex : 'relName',
                            menuDisabled : true,
                            width: 50,
                            renderer: function(value, metaData, record, rowIndex, colIndex, store) {
                             // TODO: color code different ontologies?
                             metaData.attr = "title='" + record.data.relNS + record.data.relName + "'";
                             return value;
                           },
                            editor: new Ext.form.TriggerField({
                                 parentPanel: this,
                                 editable: false,
                                 triggerClass: 'x-form-ellipsis-trigger',
                                 triggerConfig: {
                                    tag : "img", 
                                    src : Ext.BLANK_IMAGE_URL,
                                    cls: "x-form-trigger x-form-ellipsis-trigger",
                                    qtip: 'Set relationship'
                                 },
                                 onTriggerClick: function(ev) {
                                    try {
                                     // TODO: select line of interest first as it could be resource node (context menu requires it to be selected)
                                     //var row = this.parentPanel.lastEdit.row;
                                     var sel = this.parentPanel.getSelectionModel().getSelected();
                                     var coGraph = lore.ore.ui.graphicalEditor.coGraph;
                                     var selfig = coGraph.getLine(sel.id);
                                     coGraph.setCurrentSelection(selfig);
                                     selfig.onContextMenu(ev.xy[0], ev.xy[1],true);
                                    } catch (e){
                                        lore.debug.ore("Error in trigger click",e);
                                    }
                                 } 
                           })
                 }, {
                            header : 'To',
                            dataIndex : 'toTitle',
                            menuDisabled : true

                        }

                ]
            }),
            sm : new Ext.grid.RowSelectionModel({
                        singleSelect : true
            }),
            viewConfig : {
                forceFit : true,
                deferEmptyText: false,
                emptyText: "No relationships",
                scrollOffset: 0
            },
            tools : [/*{
                        id : 'plus',
                        qtip : 'Add a relationship',
                        handler : this.addRelationshipAction
                    },*/{
                        id : 'minus',
                        qtip : 'Remove the selected relationship',
                        handler : this.removeRelationshipAction
                    },{
                        id : 'help',
                        qtip : 'Display information about the selected relationship',
                        handler : this.helpRelationshipAction
                    }
            ]
                        
        });
        lore.ore.ui.RelationshipEditor.superclass.initComponent.call(this,config);
        
        // hide/show when the collapse/expand button in the toolbar is triggered
        this.on('beforecollapse', function(p){p.body.setStyle('display','none');});
        this.on('beforeexpand', function(p){p.body.setStyle('display','block');});
        this.aboutTemplate = new Ext.Template([
            "<p style='font-size:110%;'><b>From resource:</b> {fromTitle} <span style='font-size:90%'>({fromURI})</span></p>",
            "<p style='padding-top:1em;padding-bottom:1em;font-size:110%;'><b>Relationship:</b> {relName}</p>",
            "<p style='font-size:110%;'><b>To resource:</b> {toTitle} <span style='font-size:90%'>({toURI})</span></p>",
            "<p style='padding-top:3em'>This relationship is from: {relPrefix} ({relNS})</p>"
            ],
            {compiled: true}
        );
        
        this.relEditorWindow.on("show", function(){
            // force redraw of text area of popup editor on scroll to get around FF iframe bug see #209
            var taEl = this.getComponent(0).getEl();
            taEl.on("scroll",function(e,t,o){this.repaint();},taEl);
        }, this.relEditorWindow, {single:true});
        
    },
    /** Handler for plus tool button on relationship grids 
     * 
     * @param {} ev
     * @param {} toolEl
     * @param {} panel
     */
    addRelationshipAction : function (ev, toolEl, panel) {
        if (panel.collapsed) {
                panel.expand(false);
        }
        // TODO: pop up relationship editor
        
    },
    /** Handler for minus tool button on relationship grid
     * 
     * @param {} ev
     * @param {} toolEl
     * @param {} panel
     */
    removeRelationshipAction: function (ev, toolEl, panel) { 
      if (lore.ore.controller.checkReadOnly()){
          return;
      }
      try {    
        var sel = panel.getSelectionModel().getSelected();
        // don't allow delete when panel is collapsed (user can't see what is selected)
        if (panel.collapsed) {
            lore.ore.ui.vp.info("Please expand the panel and select the relationship to remove");
         } else if (sel) {
            var coGraph = lore.ore.ui.graphicalEditor.coGraph;
            var fig = coGraph.getLine(sel.id);
            if (fig){
                coGraph.commandStack.execute(fig.createCommand(new lore.draw2d.EditPolicy(lore.draw2d.EditPolicy.DELETE)));
            }
            panel.getStore().remove(sel);        
         } else {
            lore.ore.ui.vp.info("Please click on the relationship to remove prior to selecting the remove button");
         }
      } catch (ex) {
            lore.debug.ore("Error removing relationship",ex);
      }
    },
    /** Handler for help tool button on relationship grid
     * 
     * @param {} ev
     * @param {} toolEl
     * @param {} panel
     */
    helpRelationshipAction : function (ev,toolEl, panel) {
        try{
	        var sel = panel.getSelectionModel().getSelected();
	        if (panel.collapsed){
	            lore.ore.ui.vp.info("Please expand the panel and select a relationship");
	        } else if (sel){
	            var infoMsg = panel.aboutTemplate.apply(sel.data);
	            
	            Ext.Msg.show({
	                    title : lore.util.sanitizeHTML('About \"' + sel.data.relName + '\" relationship',window,true),
	                    buttons : Ext.MessageBox.OK,
	                    minWidth : '600px',
	                    msg : infoMsg // TODO: sanitize
	                });
	        } else {
	            lore.ore.ui.vp.info("Please click on a relationship prior to selecting the help button");
	        }
        } catch (e){
            lore.debug.ore("Error in helpRelationshipAction",e);
        }
    }
 
});

Ext.reg('relationshipeditor',lore.ore.ui.RelationshipEditor);