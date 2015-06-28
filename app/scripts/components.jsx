var Router = window.ReactRouter;
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var RouteHandler = Router.RouteHandler;
var Link = Router.Link;

var executeQuery = function (queryOptions, callback) {
  var licenses = {
    'freely': ['license:creativecommons.org/publicdomain/', 'license:BY/', 'license:BY-SA/'],
    'non-commercial': ['license:BY-NC', 'license:BY-NC_SA']
  }
  var query = queryOptions.query;
  var license = queryOptions.license;
  var fullQuery = query;
  if (license !== 'none') {
    var licensesQuery = licenses[license].join(' OR ');
    fullQuery = fullQuery + ' AND (' + licensesQuery +')';
  }
  $.getJSON('http://embedr.eu/search/?query='+encodeURIComponent(fullQuery), function(data) {
    callback(data);
  });
}

var SearchMixin = {
  getInitialState: function() {
    return {
      results: [],
      license: 'none'
    };
  },
  setLicense: function(license) {
    this.setState({'license': license})
  },
  search: function(query) {
    var self = this;
    executeQuery({query: query, license: this.state.license}, function(data) {
      self.setState({results: data.hits});
    });
  }
}

var App = React.createClass({
  render: function() {
    return (
      <RouteHandler/>
    )
  }
});

var Search = React.createClass({
  mixins: [SearchMixin],
  select: function(imageId) {
    this.setState(
      {
        selected: true,
        results: [],
        id: imageId
      }
    )
  },
  render: function() {
    var classes = "search";
    return (
      <div className="search">
        <ResultList results={this.state.results}/>
        <HomeHeader setLicense={this.setLicense} license={this.state.license} search={this.search} />
      </div>
    );
  }
});

var HomeHeader = React.createClass({
  render: function() {
    return (
      <div className="header">
        <div className="header__title">
          <h1 className="header__title__name"><a href="/">embedr</a></h1>
          <p className="header__title__text">High quality cultural heritage image embedding</p>
        </div>
        <ul className="header__navigation">
          <li><a href="/about">about</a></li>
          <li><a href="#">contact</a></li>
        </ul>
        <SearchBar setLicense={this.props.setLicense} license={this.props.license} search={this.props.search} />
      </div>
    )
  }
});

var SearchBar = React.createClass({
  getInitialState: function() {
    return {
      showAdvanced: false,
      query: ''
    }
  },
  showAdvanced: function(e) {
    this.setState({showAdvanced: !this.state.showAdvanced})
  },
  handleChange: function(e) {
    var query = e.target.value;
    this.setState({query: query});
  },
  search: function() {
    this.props.search(this.state.query);
  },
  handleKeyDown: function(e) {
    var ENTER = 13;
    if( e.keyCode == ENTER ) {
        this.props.search(this.state.query);
    }
  },
  render: function() {
    return (
      <div className="search_box">
        <div className="search__advanced" onClick={this.showAdvanced}>advanced search</div>
        <input className="search_bar" placeholder="Search" onChange={this.handleChange} onKeyDown={this.handleKeyDown}/>
        <div className="search__button" onClick={this.search}>
          <img src="/images/search.png" />
        </div>
        { this.state.showAdvanced ? <AdvancedSearch setLicense={this.props.setLicense} license={this.props.license} close={this.showAdvanced} /> : null }
      </div>
    );
  }
});

var AdvancedSearch = React.createClass({
  render: function() {
    return (
      <div className="search__advanced__box">
        <div className="close_button" onClick={this.props.close}>X</div>
        <ul>
          <AdvancedOption setLicense={this.props.setLicense} value="none" checked={this.props.license == 'none'}>no filter</AdvancedOption>
          <AdvancedOption setLicense={this.props.setLicense} checked={this.props.license == 'freely'} value="freely">freely reusable</AdvancedOption>
          <AdvancedOption setLicense={this.props.setLicense} checked={this.props.license == 'non-commercial'} value="non-commercial">non commercial use only</AdvancedOption>
        </ul>
      </div>
    )
  }
});

var AdvancedOption = React.createClass({
  handleChange: function() {
    this.props.setLicense(this.props.value);
  },
  render: function() {
    var license = "license"+this.props.value;
    return (
      <li>
        <label>
          <input onChange={this.handleChange} type="radio" name="license" id={license} value={this.props.value} checked={this.props.checked}/>
          {this.props.children}
        </label>
      </li>
    )
  }
})

var ResultList = React.createClass({
  render: function() {
    if (this.props.results.length == 0) return null;
    var resultNodes = this.props.results.map(function (result) {
      return (
        <Result key={result.id} result={result} />
      );
    }.bind(this));
    return (
      <div className="results__wrapper">
        <div className="results__overlay"></div>
        <div className="results">
          {resultNodes}
        </div>
      </div>
    )
  }
});

var Result = React.createClass({
  getInitialState: function () {
    return {
      buttonClass: 'is_hidden',
      showPopup: false
    };
  },
  mouseOver: function () {
    this.setState({buttonClass: 'is_shown'});
  },
  mouseOut: function () {
    this.setState({buttonClass: 'is_hidden'});
  },
  click: function () {
    this.props.select(this.props.id);
  },
  togglePopup: function(e) {
    e.preventDefault();
    this.setState({showPopup: !this.state.showPopup});
  },
  render: function() {
    return (
      <div className="result" onMouseOver={this.mouseOver} onMouseOut={this.mouseOut}>
        { this.state.showPopup ? <EmbedPopup id={this.props.result.id} close={this.togglePopup} /> : null }
        <div className={this.state.buttonClass}>
          <EmbedButton togglePopup={this.togglePopup}/>
        </div>
        <Link to="detail" params={{id: this.props.result.fields.id}}>
          <IIIFImage server="http://iiifhawk.klokantech.com" id={this.props.result.fields.id} size="150,150" />
        </Link>
        <p className="result__description">{this.props.result.fields.title[0]}</p>
      </div>
    );
  }
});

var EmbedButton = React.createClass({
  render: function() {
    return (
      <a className="button__embed" href="#" onClick={this.props.togglePopup}>
        <img src="/images/embed.png" />
      </a>
    )
  }
});

var EmbedPopup = React.createClass({
  render: function() {
    return (
      <div className="embed__popup">
        <div className="close_button" onClick={this.props.close}>X</div>
        <strong>Dit beeld embedden</strong>
        <p>Kopieer onderstaande code naar je website of blog. <a href="#">Meer informatie.</a></p>
        <textarea className="embed__box" rows="6"></textarea>
        <a className="button__copy">kopieer</a>
        <div>
          <label>Toon preview</label>
        </div>
        <IIIFImage server="http://iiifhawk.klokantech.com" id={this.props.id} size="400,150" />
      </div>
    )
  }
});

var IIIFImage = React.createClass({
  makeSource: function() {
    var server = this.props.server;
    var id = this.props.id;
    var region = this.props.region || "full";
    var size = this.props.size || "1000,";
    var rotation = this.props.rotation || "0";
    var quality = this.props.quality || "native";
    var format = this.props.format || "jpg";
    return server+"/"+id+"/"+region+"/"+size+"/"+rotation+"/"+quality + "." +format;
  },
  render: function() {
    var source = this.makeSource();
    return (
      <img src={source} />
    )
  }
});

var Detail = React.createClass({
  mixins: [SearchMixin],
  render: function() {
    return (
      <div className="detail">
        <OpenSeaDragon id={this.props.params.id}/>
        <ResultList results={this.state.results}/>
        <DetailHeader search={this.search} />
      </div>
    )
  }
});

var DetailHeader = React.createClass({
  render: function() {
    return (
      <div className="header detail">
        <div className="header__title">
          <h1 className="header__title__name"><a href="/">embedr</a></h1>
        </div>
        <ul className="header__navigation">
          <li><a href="#">about</a></li>
          <li><a href="#">contact</a></li>
        </ul>
        <SearchBar search={this.props.search} />
      </div>
    )
  }
});

var OpenSeaDragon = React.createClass({
  getInitialState: function() {
    return {
      showPopup: false,
      showInfoPopup: false
    };
  },
  componentDidMount: function() {
    $.getJSON('http://media.embedr.eu/'+this.props.id+'/manifest.json', function(result) {
      var canvas = result.sequences[0].canvases[0];
      var height = canvas.height;
      var width = canvas.width;
      var viewer = OpenSeadragon({
        id: 'detail__image',
        zoomInButton: 'zoom-in-button',
        zoomOutButton: 'zoom-out-button',
        tileSources: [
          {
            "@context": "http://iiif.io/api/image/2/context.json",
            "@id": "http://iiifhawk.klokantech.com/"+this.props.id,
            "filename": this.props.id+".jp2",
            "height": height,
            "order": 0,
            "profile": ["http://iiif.io/api/image/2/level1.json",
              {"formats": ["jpg"],
              "qualities": ["native", "color", "gray"],
              "supports": ["regionByPct", "sizeByForcedWh", "sizeByWh", "sizeAboveFull", "rotationBy90s", "mirroring", "gray"]
            }],
            "protocol": "http://iiif.io/api/image",
            "tiles": [
              {"height": 256, "scaleFactors": [1, 2, 4, 8], "width": 256}],
            "width": width
          }]
      });
    }.bind(this));
  },
  togglePopup: function(e) {
    e.preventDefault();
    this.setState({showPopup: !this.state.showPopup});
  },
  toggleInfoPopup: function(e) {
    e.preventDefault();
    this.setState({showInfoPopup: !this.state.showInfoPopup});
  },
  zoomIn: function(e) {
    e.preventDefault();
  },
  render: function() {
    return (
      <div className="detail__main">
        <div id="detail__image" />
        <EmbedButton togglePopup={this.togglePopup}/>
        { this.state.showPopup ? <EmbedPopup id={this.props.id} close={this.togglePopup}/> : null }
        <div className="button__zoom">
          <a id="zoom-in-button" href="#">
            <img src="/images/zoom-in.png" />
          </a>
        </div>
        <div className="button__zoom--out">
          <a id="zoom-out-button" href="#">
            <img src="/images/zoom-out.png" />
          </a>
        </div>
        <InformationButton togglePopup={this.toggleInfoPopup}/>
        { this.state.showInfoPopup ? <InformationPopup id={this.props.id} close={this.toggleInfoPopup}/> : null }
      </div>
    )
  }
})

var InformationButton = React.createClass({
  render: function() {
    return (
      <a className="button__metadata" href="#" onClick={this.props.togglePopup}>
        <img src="/images/metadata.png" />
      </a>
    )
  }
});

var InformationPopup = React.createClass({
  render: function() {
    return (
      <div className="metadata__popup">
      </div>
    )
  }
});

var routes = (
  <Route path="/" handler={App}>
    <DefaultRoute handler={Search}/>
    <Route name="detail" path="/:id" handler={Detail}/>
  </Route>
);

Router.run(routes, function(Root) {
  React.render(<Root/>, document.getElementById('search'))
});
