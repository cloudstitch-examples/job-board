module.exports = {
  properties: {
    textSearch: {
      type: String,
      value: '',
    },
    remoteOnly: {
      type: Boolean,
      value: false
    },
    localOnly: {
      type: Boolean,
      value: false
    },
    sortField: {
      type: String,
      value: 'Company'
    },
    limitedJobs: {
      type: Array,
      computed: 'limitJobs(jobs.*)'
    },
    jobs: {
      type: Array
    },
    route: {
      type: String,
      value: 'view'
    },
    stripeKey: {
      type: String,
      value: 'pk_live_fzsm45TdisLwO3gHOI2HbKsZ'
    },
    logoUrl: {
      type: String,
      value: 'https://static.cloudstitch.io/img/cloudstitch-square.png'
    },
    checkoutName: {
      type: String,
      value: 'Polymer Jobs'
    },
    stripeToken: {
      type: String,
      value: '',
      notify: true
    },
    email: {
      type: String
    },
    description: {
      type: String
    },
    disabled: {
      type: Boolean,
      value: false
    },
    planCode: {
    type: String
    },
    planName: {
      type: String
    },
    planCost: {
      type: Number
    }
  },

  ready: function() {
    this.set('route', 'view');
    this.set('checkoutName', 'Polymer Jobs');
    this.set('logoUrl', 'https://static.cloudstitch.io/img/cloudstitch-square.png');
    this.set('sortField', 'Company');
    var self = this;

      var head = document.getElementsByTagName('head')[0];
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://checkout.stripe.com/checkout.js';
      script.onload = function () {
          // this never get fired..
        self.handler = self._createHandler();
      }
      head.appendChild(script);

      this.limitedJobs = this.limitJobs(this.jobs);
      window.addEventListener('popstate', function() {
        if (self.handler) {  
          self.handler.close();
        }
      });

    var self = this;
    this.$.form.addEventListener('iron-form-presubmit', function() {
      self.formPreSubmit();
    });

  },

    _createHandler: function() {
      var self = this;
      return StripeCheckout.configure({
        key: this.stripeKey,
        image: this.logoUrl,
        name: this.checkoutName,
        panelLabel: 'Purchase',
        allowRememberMe: false,
        token: function(token) { self._onStripeToken(token) },
        closed: function() { self._onStripeClosed() },
        opened: function() { self._onStripeOpen() }
      });         
    },

    _onStripeOpen: function() {
      this.disabled = true;       
    },
    
    _onStripeClosed: function() {
      this.disabled = false;       
    },

  _onStripeToken: function(token) {
      //this.stripeToken = JSON.stringify(token);
      this.stripeToken = token.id;
      this.disabled = true;
      this._doSubmit();
    },

  setPlan: function() {
      this.handler.open({
        amount: this.planCost,
        email: this.email,
        description: this.description
      });
  },

  doSubmit: function() {
    switch (this.$.planType.selected) {
      case 'PlanOneMonth':
        this.planCost = 25 * 100;
        this.description = "Featured for 1 Month";
        break;
      case 'PlanTwoMonth':
        this.planCost = 40 * 100;
        this.description = "Featured for 2 Months";
        break;
      default:
        this.planCost = 0;
        this.description = "";
    }
    if (this.planCost) {
      if (this.stripeToken) {
        this._doSubmit();
      } else {
        this.setPlan();           
      }
    } else {
      this._doSubmit();
    }
  },
  
  _doSubmit: function() {
    this.$.form.submit();
  },

  add: function() {
    this.set('route', 'add');
  },

  toJobs: function() {
    this.set('route', 'view');        
  },
  
  showSuccess: function() {
    this.set('route', 'thanks');        
  },

  formPreSubmit: function(event){
    var form = this.$.logoFile;
    // here you convert to formData calling our function
    var data = new FormData(this.$.form);

    for (var i = 0; i < this.$.logoFile.files; i++) {
      var file = this.$.logoFile.files[i];
      var fileInputName = 'logoFile';
      data.append(fileInputName+'['+i+']', file);
    }

    this.$.form.request.method = "post";
    // set undefined to prevent default json content type
    this.$.form.request.contentType = undefined;
    // here you append your formData to the iron-ajax body
    this.$.form.request.body = data;
    this.$.form.request.debounceDuration = 300;
  },

  cancelSubmit: function() {
    this.set('route', 'view');
  },

  computeFilter: function(textSearch, remoteOnly, localOnly, fullTimeOnly, hourlyOnly, gigOnly) {
    return function(a) {
      var noLocation = (!(remoteOnly || localOnly));
      var noWage = (!(fullTimeOnly || hourlyOnly || gigOnly));
      var localHit = (noLocation || (localOnly && (!!a.HiringLocal)));
      var remoteHit = (noLocation || (remoteOnly && (!!a.HiringRemote)));
      var fullTimeHit = (noWage || (fullTimeOnly && (!!a.HiringFullTime)));
      var hourlyHit = (noWage || (hourlyOnly && (!!a.HiringHourly)));
      var gigHit = (noWage || (gigOnly && (!!a.HiringGig)));
      var t = textSearch.toLowerCase();
      var nameHit = (
        (textSearch == "") ||
        ((""+a.Company).toLowerCase().indexOf(t) > -1) ||
        ((""+a.Description).toLowerCase().indexOf(t) > -1) ||
        ((""+a.Location).toLowerCase().indexOf(t) > -1)
      );
      return nameHit && (localHit || remoteHit) && (fullTimeHit || hourlyHit || gigHit);
    }
  },

  limitJobs: function(jobs) {
    if (typeof this.jobs == 'object') {
      var slice = this.jobs.slice(0);
      for (var i = 0; i < slice.length; i++) {
        slice[i].HiringLocal = !!slice[i].HiringLocal;
        slice[i].HiringRemote = !!slice[i].HiringRemote; 
        slice[i].Sponsored = !!slice[i].Sponsored;
        slice[i].HiringFullTime = !!slice[i].HiringFullTime;
        slice[i].HiringHourly = !!slice[i].HiringHourly;
        slice[i].HiringGig = !!slice[i].HiringGig;
        slice[i].HasLogo = !!slice[i].LogoUrl;

      }
      console.log(slice);
      return slice;
    } else {
      return [];
    }
  },

  computeSort: function(sortField) {
    if (!sortField) sortField = 'Company';
    return function(a,b) {
      var TOP = -1;
      var BOTTOM = 1;
      if (a.Sponsored && (! b.Sponsored))  {
        return TOP;
      }
      if (b.Sponsored && (! a.Sponsored))  {
        return BOTTOM;
      }
      return a[sortField].localeCompare(b[sortField]);
    }
  }
}