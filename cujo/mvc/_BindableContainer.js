/*
    cujo.mvc._BindableContainer
    (c) copyright 2010, unscriptable.com
    author: john

    LICENSE: see the LICENSE.txt file. If file is missing, this file is subject to the AFL 3.0
    license at the following url: http://www.opensource.org/licenses/afl-3.0.php.

    A mixin for views to add functionality necessary to bind multiple sub-views (or dom fragments)
    to values in a result set.

    Use cujo._BindableContainer as a mixin in a multiple-inheritance pattern:
        dojo.declare('myClass', cujo._BindableContainer, { ... }); // mixin

*/
dojo.provide('cujo.mvc._BindableContainer');

(function () {

dojo.declare('cujo.mvc._BindableContainer', null, {

    //  resultSetRoot: String
    //      The name of the node that holds the data bound items. This will be the node that has a
    //      data-dojo-attach attribute (dojoAttachPoint) of the same name.  There will be one data bound node
    //      per item in the result set. Typically, you'd leave this at its default value, 'containerNode'.
    resultSetRoot: 'containerNode',

    //  resultSetItem: String
    //      The name of the node that is cloned and bound to each item in the result set. This will be the node
    //      that has a data-dojo-attach attribute (dojoAttachPoint) of the same name.  If this node also has a
    //      data-dojo-type (dojotype) attribute, it will be instantiated as a widget and assumed to have the
    //      cujo.mvc._Bindable mixin. Typically, you'd leave this at its default value, 'itemNode'.
    resultSetItem: 'itemNode',

    //  resultSet: Object
    //      The collection of data items used to create and bind the sub-views. Note: you must use get() and
    //      set() to access this property.
    resultSet: null,

    //  boundViews: Array
    //      The collection of sub-views created and bound to data items in resultSet.  These get generated
    //      automatically.
    boundViews: null,

    // hooks to catch item modifications
    itemAdded: function (item) {},
    itemUpdated: function (item) {},
    itemDeleted: function (item) {},

    constructor: function () {
        // create list of items
        this.boundViews = [];
    },

    buildRendering: function () {
        var result = this.inherited(arguments);
        if (this.resultSet) {
            this._initResultSet();
        }
        return result;
    },

    uninitialize: function () {
        this._unwatchResultSet();
        this.inherited(arguments);
    },

    _getResultSetAttr: function () {
        return this.resultSet;
    },

    _setResultSetAttr: function (rs) {
        // unsubscribe from any previous resultSet
        if (this.resultSet) {
            this._unwatchResultSet();
        }
        // save result set and initialize
        this.resultSet = rs || null;
        this._initResultSet();
    },

    _initResultSet: function () {
        // subscribe to onAdd, onUpdate, and onRemove
        if (this.resultSet) {
            // TODO: will the progress handler ever fire?
            dojo.when(this.resultSet, dojo.hitch(this, '_resultsLoaded'), dojo.hitch(this, '_resultsError'), dojo.hitch(this, '_itemAdded'));
            this._watchResultSet();
        }
    },

    _watchResultSet: function () {
        var rs = this.resultSet;
        if (rs && rs.observe) {
            var dismiss = rs.observe(dojo.hitch(this, '_handleResultSetEvent')).dismiss,
                handle = this.connect(this, '_unwatchResultSet', function () {
                    if (dismiss) dismiss();
                    this.disconnect(handle);
                });
        }
    },

    _unwatchResultSet: function () {
        //  summary: this gets called when the result set is unwatched but unwatching
        //      happens in a callback within _watchResultSet
    },

    _handleResultSetEvent: function (item, oldIndex, newIndex) {
        // summary: fires when an item in result set changes
        // TODO: debounce these to catch moves instead of deleting/recreating
        //      - create a new debounced method to do the adds/deletes/moves and make 
        //        this method accrue add/del operations.
        //      - or will transaction() handle this better than debounce?
        if (oldIndex == -1 || newIndex == -1) {
            // TODO: ok, what to do if the dev hasn't defined a queryExecutor?
        }
        else if (oldIndex == newIndex) {
            // item didn't move. don't do anything
        }
        else if (newIndex >= 0) {
            this._itemAdded(item, newIndex);
        }
        else {
            this._itemDeleted(item, oldIndex);
        }
    },

    _resultsLoaded: function (rs) {
        dojo.forEach(rs, function (dataItem) {
            this._itemAdded(dataItem);
        }, this);
    },

    _resultsError: function (err) {
        // TODO
    },

    _itemAdded: function (item, index) {
        var views = this.boundViews,
            pos = index >= 0 ? index : views.length,
            widget = this._createBoundItem(item, pos);
        views.splice(pos, 0, widget);
        this.itemAdded(widget);
        return widget;
    },

    _itemDeleted: function (item, index) {
        var removed = this.boundViews.splice(index, 1)[0];
        if (removed) {
            removed.destroyRecursive();
            this.itemDeleted(removed);
        }
    },

    _attachTemplateNodes: function (rootNode, getAttrFunc) {
        // snatch template out of html before it's constructed as a widget

        var result = this.inherited('_attachTemplateNodes', arguments);

        // remove data item template from DOM (it's still a node at this point)
        var tmplNode = this.itemTemplate;
        if (!tmplNode) {
            // oops! dijit doesn't hook up anything with a dojotype attr, yet
            var query = '[' + this._attrAttach + '=' + this.resultSetItem + ']';
            this.itemTemplate = tmplNode = dojo.query(query, this.domNode)[0];
        }
        if (tmplNode && tmplNode.parentNode) {
            tmplNode.parentNode.removeChild(tmplNode);
        }

        return result;

    },

    _createBoundItem: function (dataItem, index) {
        // TODO: is there any way we can create a DataBoundView automagically if the node is not a widget?
        var node = this.itemTemplate.cloneNode(true),
            dojoType = dojo.attr(this.itemTemplate, 'dojotype');
        dojo.place(node, this.containerNode, index >= 0 ? index : 'last');
        var ctor = dojo.getObject(dojoType),
            widget = new ctor({dataItem: dataItem}, node);
        return widget;
    }

});

})();
