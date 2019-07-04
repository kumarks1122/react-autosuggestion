import React, { Component } from 'react';

import './style.css'

import fetchApi from '../../services/request';

// import Result from './Result'


String.prototype.replaceAll = function(strReplace, strWith) {
  var esc = strReplace.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  var reg = new RegExp(esc, 'ig');
  return this.replace(reg, strWith);
};

class SearchBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      resultVisible: false,
      userApiResults: [],
      searchQuery: "",
      filtered: [],
      activeSelectionIndex: undefined
    }
    this.handleKeyPress()
  }

  loadApiResult = () => {
    this.setState({ resultVisible: true }, () => {
      this.handleMouseOver()
    })
    const { userApiResults } = this.state;

    if (userApiResults.length > 0) return true

    fetchApi("/5ba8efb23100007200c2750c", "get", {}, (response)=> {
      this.setState({ userApiResults: response, filtered: response })
    })

  }

  handleSearchQuery = (ev) => {
    this.setState({ searchQuery: ev.target.value }, () => {
      this.searchUser(this.state.searchQuery)
    })
  }

  searchUser = (query) => {
    query = query.toLowerCase()
    let { userApiResults } = this.state;
    if (query.length === 0) {
      this.setState({ filtered: userApiResults})
      return true
    }
    var filtered = userApiResults.map((user) => {
      var isFound = false
      var foundInItems = false
      var userCloned = Object.assign({}, user)
      var userKeys = Object.keys(userCloned)

      for (var i = 0; i < userKeys.length; i++) {
        var value = userCloned[userKeys[i]]
        if (typeof value === "object") {
          for (var j = 0; j < value.length; j++) {
            if (value[j].toLowerCase().includes(query)) {
              isFound = true
              foundInItems = true
              break;
            }
          }
        } else {
          var occurances = []
          if (value.toLowerCase().includes(query)) {
            isFound = true
            var re = new RegExp(query, 'gi');
            var stringMatches = value.match(re); 
            for (var k = 0; k < stringMatches.length; k++) {
              var stringMatch = stringMatches[k]
              if (!occurances.includes(stringMatch.toLowerCase())){
                value = value.replaceAll(stringMatch, `<b>${stringMatch}</b>`)
                occurances.push(stringMatch.toLowerCase())
              }
            }
            value = value.replaceAll("</b><b>", "")
            var firstOccOfb = value.indexOf("<b>")
            value = value.slice(firstOccOfb > 15 ? firstOccOfb-10 >= 0 ? firstOccOfb-10 : 0: 0, value.length)
            value = firstOccOfb > 15 ? `...${value}`: value
            userCloned[userKeys[i]] = value
          }
        }
      }

      userCloned["foundInItems"] = foundInItems
      return isFound ? userCloned : null 
    }).filter(a => !!a)

    this.setState({ filtered, activeSelectionIndex: undefined })
  }

  hideResults = () => {
    this.setState({ resultVisible: false })
  }

  handleMouseOver = () => {
    document.getElementsByClassName("Result-Container")[0].addEventListener("mousemove", (ev) => {
      var counter=0;
      var currentNode = ev.target
      while (counter<2) {
        if (currentNode.classList.contains("Result-Card")) {
          break
        }
        currentNode = currentNode.parentNode;
        counter++;
      }
      var activeSelectionIndex = parseInt(currentNode.getAttribute('index'))
      if (activeSelectionIndex.toString() !== "NaN") {
        this.setState({ activeSelectionIndex, noCursor: false })
      }
    })
  }

  handleKeyPress = () => {
    document.addEventListener('keydown', (ev) => {
      if(!this.state.resultVisible) return true

      const { filtered } = this.state
      var { activeSelectionIndex } = this.state
      var scrollIntoViewType = false

      if ([40,38].includes(ev.keyCode) &&
        (activeSelectionIndex === undefined || (activeSelectionIndex < filtered.length && activeSelectionIndex >= 0))) {
        if(ev.keyCode === 40 && (activeSelectionIndex === undefined || activeSelectionIndex < filtered.length - 1)) {
          // up arrow
          activeSelectionIndex = activeSelectionIndex === undefined ? -1 : activeSelectionIndex
          activeSelectionIndex += 1
          scrollIntoViewType = false
        } else if(ev.keyCode === 38 && (activeSelectionIndex === undefined || activeSelectionIndex > 0)) {
          // down arrow        
          activeSelectionIndex = activeSelectionIndex === undefined ? filtered.length : activeSelectionIndex
          activeSelectionIndex -= 1
          scrollIntoViewType = true
        }

        var resultContainer = document.getElementsByClassName("Result-Container")[0]
        var activeCardContainer = document.getElementsByClassName("active-card")[0]

        if (!!activeCardContainer) {
          var activeScrollHeight = activeCardContainer.getBoundingClientRect().top - resultContainer.getBoundingClientRect().top
        }
        this.setState({ activeSelectionIndex }, ()=> {
          if (filtered.length > 0) {
            if (activeScrollHeight === 0 && scrollIntoViewType) {
              document.getElementsByClassName("active-card")[0].scrollIntoView(true)
            } else {
              document.getElementsByClassName("active-card")[0].scrollIntoViewIfNeeded(scrollIntoViewType)
            }
          }
        })
      }
    })

  }

  results = () => {
    const { filtered, searchQuery, activeSelectionIndex } = this.state;
    return (
      <div className="Result-Container">
        {
          filtered.length > 0 && filtered.map((result,index) => {
            return (
              <div key={index} index={index} className={`Result-Card ${activeSelectionIndex !== undefined && index === activeSelectionIndex ? "active-card" : ""}`}>
                <div className="userid" dangerouslySetInnerHTML={{ __html: result.id }} />
                <div className="username" dangerouslySetInnerHTML={{ __html: result.name }} />
                {
                  result.foundInItems && (
                    <div className="itempresent"><em>&bull; '{searchQuery}'</em> Found in items</div>
                  ) 
                }
                <div className="address" dangerouslySetInnerHTML={{ __html: result.address }}/>
              </div>
            )
          })
        }

        {
          filtered.length === 0 && (
            <div className="Result-Card No-Result-Card">
              <span>
                No Result Found
              </span>  
            </div>
          )
        }
      </div>
    );
  }

  render(){
    const { resultVisible, searchQuery } = this.state;
    return (
      <div className="Search-Input-Container">
        <input
          type="text"
          className="Search-Input-field"
          name="search"
          value={searchQuery}
          onChange={this.handleSearchQuery}
          onFocus={this.loadApiResult}
          onBlur={this.hideResults}
          />
        {
          resultVisible && this.results()
        }
      </div>
    )
  }
}

export default SearchBar;
