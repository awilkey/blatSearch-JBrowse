define([
           'dojo/_base/declare',
           'dojo/_base/lang',
           'dojo/Deferred',
           'dojo/dom',
           'dojo/dom-construct',
           'dijit/MenuSeparator', 
           'dijit/CheckedMenuItem',
           'dijit/form/DropDownButton',
           'dijit/DropDownMenu',
           'dijit/form/Button',
            'dijit/MenuItem',
           'JBrowse/Plugin',
           './View/SearchSeqDialog'
       ],
       function(
           declare,
           lang,
           Deferred,
           dom,
           domConstruct,
           dijitMenuSeparator, 
           dijitCheckedMenuItem, 
           dijitDropDownButton, 
           dijitDropDownMenu, 
           dijitButton,
           dijitMenuItem,
           JBrowsePlugin,
           SearchSeqDialog
       ) {
return declare( JBrowsePlugin,
{ constructor: function( args ) {
        this._searchTrackCount = 0;
		var searchButton;
        var thisB = this;
        var menu;
        this.browser.afterMilestone('initView', function() {
        
        var buttontext =  new dijitMenuItem(
                                    {
                                        label: 'Search sequence',
                                        iconClass: 'dijitIconBookmark',
                                         onClick: lang.hitch(this, 'createSearchTrack')                           
                                });
        
        this.browser.renderGlobalMenu('tools',{},this.browser.menuBar);
        this.browser.addGlobalMenuItem('tools',buttontext);
        },this );
    },


    createSearchTrack: function() {
		var refSeq = this.browser.refSeq.name;
		var dataRoot = this.browser.config.dataRoot;
		console.log(refSeq + " und " + dataRoot);	
		console.log(this.browser._highlight);
        var searchDialog = new SearchSeqDialog();
        var browser = this.browser;
        searchDialog.show(refSeq, dataRoot,browser,
            function( searchParams ) {
                if( searchParams ){console.log(searchParams);}
                    return;
            });
}

});
});
