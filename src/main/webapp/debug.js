var EXPORTED_SYMBOLS = ['debug'];



/**
 * @class lore.debug 
 * @singleton
 */
debug = {
    FB_UI: '[UI] ',
    FB_ANNO: '[ANNO] ',
    FB_ORE: '[ORE] ',
    FB_TM: '[TM] ',
    UI: 'LORE-UI ',
    ANNO: 'LORE-ANNO ',
    ORE: 'LORE-ORE ',
    TM: 'LORE-TM ',

    /**
     * Log message to the built-in mozilla console service
     * can attach listeners which peform further formatting
     * also will go to the default Error Console provided in
     * Firefox
     * @param {String} module Code module which this message applies to
     * @param {String} message The logging message
     * @param {Object} obj An object to attach
     */
    mozConsole : function (module, message, obj) {
        var cons = (debug.moz? debug.moz.console : this.console);
        if (cons) {
            // print details of exceptions to console
            var consoleMsg = module + " : " + new Date().toLocaleTimeString() + " : " + message;
            if (obj && obj.name){
                consoleMsg += ": " + obj.name;
            }
            if (obj && obj.message){
                consoleMsg += ": " + obj.message;
            }
            if (obj && obj.fileName && obj.lineNumber){
                consoleMsg += " (" + obj.fileName + " line " + obj.lineNumber + ")";
            }
            cons.logStringMessage(consoleMsg);
            if ( obj instanceof Error){
                Components.utils.reportError(obj);
            }
        }
    },
    /**
     * Log debug message for UI components
     * @param {} message
     * @param {} obj
     */
    ui : function (message, obj){
		console.log(message);
		if (obj instanceof Error) {
        	throw(obj);
    	} else if (obj) {
        	console.log(obj);
    	}
    	
    	/*if (debug.fbTrace.DBG_LORE_UI){
            debug.fbTrace.sysout(debug.FB_UI + message, obj);
        } 
        debug.mozConsole(debug.UI, message, obj);*/
    },
    
    /**
     * Log debug message for Annotations components
     * @param {} message
     * @param {} obj
     */
    anno : function (message, obj){
        if (debug.fbTrace.DBG_LORE_ANNOTATIONS){
            debug.fbTrace.sysout(debug.FB_ANNO + message, obj);
        } 
        debug.mozConsole(debug.ANNO, message, obj);
    },
    
    /**
     * Lore debug message for ORE components
     * @param {} message
     * @param {} obj
     */
    ore : function (message, obj){
		console.log(message);
    	if (obj instanceof Error) {
        	throw(obj);
    	} else if (obj) {
        	console.log(obj);
    	}
    	//console.log(obj);
        /*if (debug.fbTrace.DBG_LORE_COMPOUND_OBJECTS){
            debug.fbTrace.sysout(debug.FB_ORE + message, obj);
        } 
        debug.mozConsole(debug.ORE, message, obj);*/
    },
    
    /**
     * Log debug message for Text mining components
     * @param {} message
     * @param {} obj
     */
    tm : function (message, obj){
        if (debug.fbTrace.DBG_LORE_TEXT_MINING){
            debug.fbTrace.sysout(debug.FB_TM + message, obj);
        } 
        debug.mozConsole(debug.TM, message, obj);
    },
    
    enableFileLogger : function (enable) {
        /*if ( enable && !debug.moz ) {
            debug.moz = new MozillaFileLogger();
        } else if( !enable && debug.moz) {
            debug.moz.destruct();
            debug.moz = null;
        }*/
    },
    
    /**
     * Record the current time, for profiling a series of events
     */
    startTiming : function() {
        debug.starttime = Date.now();
    },
    
    /**
     * Log the elapsed time since calling startTiming() with the included message
     * @param {} message
     */
    timeElapsed : function(message, obj) {
        if (debug.fbTrace.DBG_LORE_PROFILING) {
            var elapsed = Date.now() - debug.starttime;
            debug.fbTrace.sysout(" Elapsed: " + elapsed + "ms " + message, obj);
        }
    },
    getRecentLog : function(){
        if (this.listener){
            return this.listener.recentLog;
        }
    },
    initRecentLog: function(){
        this.console = Components.classes["@mozilla.org/consoleservice;1"]
        .getService(Components.interfaces.nsIConsoleService);
        // keep track of most recent contents of log
        this.listener = {
            recentLog : "",
            observe: function(aMessage){
                var content = aMessage.message;
                if (content && content.indexOf('LORE') == 0){
                    // truncate
                   this.recentLog = content + "%0A" 
                    + (this.recentLog.length > 1200? this.recentLog.substring(0,1200) : this.recentLog);              
                }
            },
            QueryInterface: function(iid){
                if (!iid.equals(Components.interfaces.nsIConsoleListener) &&
                !iid.equals(Components.interfaces.nsISupports)) {
                    throw Components.results.NS_ERROR_NO_INTERFACE;
                }
                return this;
            }
        },
        this.console.registerListener(this.listener);
    }
    /** @property fbTrace
     * Instance of Firebug Tracer */
};
/**
 * @class lore.MozillaFileLogger
 * Allow logging to file
 */
function MozillaFileLogger(){
    this.console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
    // TODO: update for Firefox 4
    var e = Components.classes["@mozilla.org/extensions/manager;1"]
        .getService(Components.interfaces.nsIExtensionManager)
        .getInstallLocation(constants.EXTENSION_ID)
        .getItemLocation(constants.EXTENSION_ID);
        
    var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(e.path);
    file.append("content");
    file.append("lore.log");
    
    if (!file.exists()) {
        file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420);
    }
    
    var stream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
    stream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);
    this.fstream = stream;
    
    this.exitObserver = {
          observe: function(subject, topic, data) {
                this.parent.destruct();
          },
          register: function(parent) {
            this.parent = parent;
            var observerService = Components.classes["@mozilla.org/observer-service;1"]
                                  .getService(Components.interfaces.nsIObserverService);
            observerService.addObserver(this, "quit-application", false);
          },
          unregister: function() {
            var observerService = Components.classes["@mozilla.org/observer-service;1"]
                                    .getService(Components.interfaces.nsIObserverService);
            observerService.removeObserver(this, "quit-application");
          }
    };

    this.exitObserver.register(this);
            
    this.listener = {
    
        observe: function(aMessage){
            
            var content = aMessage.message;
                        
            //dump("Log : " + aMessage.message);
            if (content && (content.indexOf(debug.UI) == 0 ||
            content.indexOf(debug.ANNO) == 0 ||
            content.indexOf(debug.ORE) == 0 ||
            content.indexOf(debug.TM) == 0)) {
                content = new Date().toString() +":  " + content + "\r\n";
                stream.write(content, content.length);
            }
        },
        
        QueryInterface: function(iid){
            if (!iid.equals(Components.interfaces.nsIConsoleListener) &&
            !iid.equals(Components.interfaces.nsISupports)) {
                throw Components.results.NS_ERROR_NO_INTERFACE;
            }
            return this;
        }
    };
    this.console.registerListener(this.listener);
}

MozillaFileLogger.prototype.destruct = function() {
    this.console.unregisterListener(this.listener);
    this.fstream.close();
    this.exitObserver.unregister();
};

debug.fbTrace = {};

//Use Firebug trace console for debug logs - edit the extension preferences to enable (about:config)
try {
    Components.utils["import"]("resource://firebug/firebug-trace-service.js");
    debug.fbTrace = traceConsoleService.getTracer("extensions.lore");
} catch (ex) {
    // Maybe this is an old version of Firebug, try loading the trace service from XPCOM
    try {
        debug.fbTrace = Components.classes["@joehewitt.com/firebug-trace-service;1"] 
            .getService(Components.interfaces.nsISupports) 
            .wrappedJSObject 
            .getTracer("extensions.lore"); 
    } catch (ex) {
        // suppress errors if getting fbTrace fails - Firebug probably not installed/enabled  
    }
}

lore.debug = debug;
