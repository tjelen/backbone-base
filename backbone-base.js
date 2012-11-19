/**
 * Backbone-base .. various Backbone.js augmentations
 *
 */
define([
  'jquery',
  'underscore',
  'backbone'
], function ($, _, Backbone) {
  
  // Extend Backbone Classes with a 'super' function to execute a method of an instance's superclass
  _.each(['Collection', 'Model', 'View', 'Router'], function(cname) {
    Backbone[cname].prototype._super_ = function(fname) {
      return this.constructor.__super__[fname].apply(this, _.rest(arguments))
    }
  })
  
  /**  
   * Create global application namespace, which also serves as a global messaging hub
   */
  var base = window.base = _.extend((window.base || {}), Backbone.Events)
  
  base.$ = $
  base._ = _

  base.extend = Backbone.Model.extend
  base.Collection = Backbone.Collection
  base.Events = Backbone.Events
  

  /**
   * Controller: a plain class used for binding multiple views and/or model
   */
  var Controller = base.Controller = function (options) {
    this.configure(options || {})
    this.initialize.apply(this, arguments)
  }
  _.extend(Controller.prototype, Backbone.Events, {
    initialize: function () { },
    
    controllerOptions: [ ], // options that will be inserted directly to controller
    
    configure: function (options) {
      this.options && (options = _.extend({}, this.options, options))
      for (var i = 0, l = this.controllerOptions.length; i < l; i++) {
        var attr = this.controllerOptions[i]
        options[attr] && (this[attr] = options[attr])
      }
      this.options = options
    }
  })
  
  Controller.extend = base.extend
  
  /**
   * Base view class
   * Has additional 'unbind' method for removing all event handlers
   */
  base.View = Backbone.View.extend({
    template: null,
    initialize: function () {
      this.render()
      this.bind && this.bind()
    },
    render: function () {
      var data = this.model.toJSON()
      this.$el.html(this.template(data))
    },
    remove: function () {
      this.unbind && this.unbind()
      this.$el.remove()
      return this
    },
    unbind: function () {
      // unbind all possible handlers
      this.model && this.model.off(null, null, this)
      this.collection && this.collection.off(null, null, this)
      base.off(null, null, this)
    }
  })

  /**
   * Collection View
   * view that contains children views based on collection
   * and synchronizes itself with collection changes (even sorting and reset)
   */
  base.CollectionView = base.View.extend({

    itemView: base.View, // class for creating child views
    
    initialize: function (options) {
      this.views = {}
      this.collection.each(this.onAdd, this)
      this.bind && this.bind()
    },
    
    onAdd: function (model, coll, options) {
      var view = new this.itemView({ model: model })
      this.views[model.cid] = view
      
      if (this.$el && view.$el) {
        var children = this.$el.children()
          , $next = children.eq(options.index)
        
        if (!$next.length) {
          this.$el.append(view.$el)
        }
        else {
          $next.before(view.$el)
        }
      }
    },
    
    onRemove: function (model) {
      var cid = model.cid
        , view = this.views[cid]
      
      view && view.remove()
      delete this.views[cid]
    },
    
    onReset: function () {
      _(this.views).each(function (view) {
        view.remove()
      })
      this.views = {}
    },
    
    onSort: function () {
      _.each(this.views, function (view) {
        view.$el.detach()
      })
      this.collection.each(function (view) {
        this.$el.append(view.$el)
      }, this)
    },
    
    // override the default sort to fire 'sort' event instead of 'reset'
    sort: function(options) {
      options || (options = {})
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator')
      var boundComparator = _.bind(this.comparator, this)
      if (this.comparator.length == 1) {
        this.models = this.sortBy(boundComparator)
      } else {
        this.models.sort(boundComparator)
      }
      if (!options.silent) this.trigger('sort', this, options)
      return this
    },
    
    bind: function () {
      this.collection.on('add', this.onAdd, this)
      this.collection.on('remove', this.onRemove, this)
      this.collection.on('reset', this.onReset, this)
      this.collection.on('sort', this.onSort, this)
    },
    
    unbind: function () {
      // remove all callbacks for this view
      this.collection.off(null, null, this)
    },
    
    render: function () {
      return this
    },
    
    getElemByCid: function (cid) {
      var view = this.views[cid]
      return (view ? view.$el : null)
    }
  })
  
  return base
})
