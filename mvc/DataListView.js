/*
    cujo.mvc.DataListView
    (c) copyright 2010, unscriptable.com
    author: john

    LICENSE: see the LICENSE.txt file. If file is missing, this file is subject to the AFL 3.0
    license at the following url: http://www.opensource.org/licenses/afl-3.0.php.

    Introduces some new cujo view states (see cujo.mvc.DataListView.dataStates below):
        cujoListUnknown - the view does not yet know if there is a result set or not
        cujoListEmpty - the view received a result set, but it is empty
        cujoListBound - the view is bound to a result set that is not empty

*/
dojo.provide('cujo.mvc.DataListView');

dojo.require('cujo.mvc.BaseView');
dojo.require('cujo.mvc._BindableContainer');

(function () { // local scope

dojo.declare('cujo.mvc.DataListView', [cujo.mvc.BaseView, cujo.mvc._BindableContainer], {

    // TODO: apply requireLocalization/getLocalization
    strings: {
    },

    postCreate: function () {
        this._refreshDataState();
        return this.inherited(arguments);
    },

    _setResultSetAttr: function (item) {
        //  summary: overrides cujo.mvc._BindableContainer's _setResultSetAttr to toggle state
        this._refreshDataState();
        return this.inherited(arguments);
    },

    _refreshDataState: function () {
        this.state({state: dataStateMapper(this[this.dataItemAttr]), set: dataStates});
    }

});

var dataStates = cujo.mvc.DataListView.dataStates = {
        unknown: 'cujoListUnknown',
        empty: 'cujoListEmpty',
        bound: 'cujoListBound'
        // TODO: add a state to indicate list is only partially loaded?
    },
    dataStateMapper = function (resultSet) {
        return (
            resultSet === undefined ? dataStates.unknown :
            resultSet.length == 0 ? dataStates.empty :
            dataStates.bound
        );
    };

})(); // end of local scope