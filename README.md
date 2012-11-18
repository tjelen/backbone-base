# Backbone base

Various Backbone.js augmentations and helper classes.

## Features

* Global application namespace and event hub
* \_super\_ method for calling methods in superclass
* Minimal Controller class, for encapsulating logic that involves several view or models.
* Improved View class that removes all event handlers when the view is removed.
* CollectionView class, for views based on collection:
  * Automatic adding/removing children views
  * Sort children views when collection is sorted
  * Supports collection reset