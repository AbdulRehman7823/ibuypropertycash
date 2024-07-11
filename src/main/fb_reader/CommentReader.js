const { ipcRenderer } = require("electron");

const CommentReader = {

  generateRandomId: function () {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  },


  init: function (data, config) {
    this.scrollBottom(data, config);
  },

  scrollBottom: function (data, config) {
    try {
      window.scrollBy("top", 1000);
      config.onupdate({id:config.id,message:'Scrolling down ...'});

      setTimeout(() => this.inspect(data, config), config.actionDelay);
    } catch (err) {
      console.error(err);
      this.handleError(data, config, err);
    }
  },


  inspect: async function (data, config) {
    try {
      config.onupdate({id:config.id,message:'Try Find ads related to "Property" ...'});
      let mainDivs = document.querySelectorAll(
        'div[role="main"] div.x1lliihq:not([class*=" "])'
      );
      let currentData = {};
      for (let div of mainDivs) {
        if (div.innerHTML.trim() != "") {
          let canvas = div.querySelector("a canvas");
          if (canvas) {
            let h4El = div.querySelector("h4");
            if (h4El) {
              let link = h4El.querySelector("a")?.href;
              let found = config.posts.find((p) => p.profile == link);
              if (found) {
                continue;
              }
            }

            let dataUrl = canvas.toDataURL("image/png");
            let data = await ipcRenderer.invoke("fetch-text", {
              dataUrl: dataUrl,
            });
            if (data.toLowerCase().includes("sponsored") && this.isKeywordMatch(div.innerText)) {  
              currentData.div = div;
              if (h4El) {
                 let profileLink = h4El.querySelector("a")?.href;
                let name = h4El.textContent;
                if (profileLink) {
                  currentData.profile = profileLink;
                  currentData.title = name;
                }
              }
            }
          }
          if (currentData.div) {
            break;
          }
        }
      }

      if (!currentData.div) {
        this.scrollBottom(data, config);
        return;
      }

      let post = {
        profile: currentData.profile,
        title: currentData.title,
        keyId: this.generateRandomId(),
        comments: [],
      };
      config.posts.push(post);
      data.currentPost = post;
      data.currentData = currentData;
      this.startExecution(data, config);
    } catch (err) {
      console.error(err);
      this.handleError(data, config, err);
    }
  },

  startExecution: function (data, config) {
    try {
      this.clickCommentButton(data, config);
    } catch (err) {
      console.error(err);
      this.handleError(data, config, err);
    }
  },

  clickCommentButton: function (data, config) {
    try {

      config.onupdate({id:config.id,message:'One ads Found. Clicking Comment Button.'});

      let parent = data.currentData.div;
      let commentBtn = parent.querySelector(
        'div[aria-label="Leave a comment"][role="button"]'
      );
      if (!commentBtn) {
        this.handleError(data, config, "No comment Button found",'low');
        return;
      }

      commentBtn.click();
      setTimeout(() => {
        this.clickMostRelevantButton(data, config);
      }, config.actionDelay);
    } catch (err) {
      console.error(err);
      this.handleError(data, config, err);
    }
  },

  clickMostRelevantButton: function (data, config) {
    try {


      config.onupdate({id:config.id,message:'Try to click "All Comments" button.'});

      let modal = document
        .querySelector('div[role="dialog"] div[aria-label="Close"]')
        .closest('div[role="dialog"]');
      if (!modal) {
        this.handleError(data, config, "Modal Not found",'low');
        return;
      }
      data.currentModal = modal;
      let mostRelevantButton = null;
      modal.querySelectorAll('div[role="button"]').forEach((btn) => {
        if (
          btn.textContent.trim() == "Most relevant" ||
          btn.textContent.trim() == "Newest"
        ) {
          mostRelevantButton = btn;
        } else if (btn.textContent.trim() == "All comments") {
          mostRelevantButton = "all";
        }
      });

      if (!mostRelevantButton) {
        this.handleError(data, config, "Most Relevant Button not found",'low');
        return;
      }

      if (mostRelevantButton === "all") {
        this.readComments(data, config);
      } else {
        mostRelevantButton.click();
        setTimeout(() => {
          this.clickAllCommentsBtn(data, config);
        }, config.actionDelay);
      }
    } catch (err) {
      console.error(err);

      this.handleError(data, config, err,'low');
    }
  },

  clickAllCommentsBtn: function (data, config) {
    try {
      let selectedItem = null;
      let menu = document.querySelector('div[role="menu"]');
      menu.querySelectorAll('div[role="menuitem"]').forEach((menuItem) => {
        let span = menuItem.querySelector("span").textContent;
        if (span.trim() == "All comments") {
          selectedItem = menuItem;
        }
      });

      if (selectedItem) {
        selectedItem.click();
      }
      setTimeout(() => {
        this.readComments(data, config);
      }, config.actionDelay);
    } catch (err) {
      console.error(err);
      this.handleError(data, config, err,'low');
    }
  },

  readComments: function (data, config) {
    try {


      let modal = data.currentModal;
      let scrollParent =
        modal.querySelector("h2").parentNode.parentNode.nextSibling;
      if (!scrollParent) {
        this.handleError(data, config, "Scroll parent not found");
        return;
      }
      scrollParent.scrollTop = scrollParent.scrollHeight;

      let comments = [];

      modal.querySelectorAll("div[aria-label]").forEach((comment) => {
        let attr = comment.getAttribute("aria-label");
        if (attr.startsWith("Comment by")) {
          comments.push(this.getDataFromComment(comment));
        }
      });

      data.currentPost.comments = comments;
      config.onupdate({id:config.id,post:data.currentPost});
      this.next(data, config);
    } catch (err) {
      console.error(err);
      this.handleError(data, config, err);
    }
  },

  next: function (data, config) {
    try {


      let closeBtn = document.querySelector(
        'div[role="dialog"] div[aria-label="Close"]'
      );

      if (!closeBtn) {
        this.handleError(data, config, "Close Button Not found");
        return;
      }

      closeBtn.click();

      if (config.posts.length >= config.max) {
        this.complete(data, config);
        return;
      }
      config.onupdate({id:config.id,message:'Moving Next to find more ads related to properties'});
      setTimeout(() => {
        data = {};
        this.scrollBottom(data, config);
      }, config.actionDelay);
    } catch (er) {
      console.error(err);

      this.handleError(data, config, err);
    }
  },

  complete: function (data, config) {
    let object = {
      posts: config.posts,
    };
    config.oncomplete(object);
    return;
  },

  getDataFromComment(el) {
    let data = {};
    let profileImage =
      el.querySelector("image")?.getAttribute("xlink:href") || "";
    let profileLink = el.querySelector("a")?.getAttribute("href") || "";
    let name = el.querySelector("a span")?.textContent || "";
    let comment = el.querySelector('div[dir="auto"]')?.textContent || "";
    data.name = name;
    data.profile = profileLink;
    data.comment = comment;
    data.img = profileImage;
    return data;
  },

  handleError: function (data, config, err,intensity='high') {

    if(intensity == 'low'){
      setTimeout(() => {
        data = {};
        this.scrollBottom(data, config);
      }, config.actionDelay);
      return;
    }
    console.log(data, config, err);
    config.onerror({id:config.id,posts:config.posts,error:err});
    return;
  },

 isKeywordMatch: function(text) {
    // List of keywords to search for
    const keywords = [
      "property",
      "house",
      "housing",
      "buy property",
      "cash property",
      "property cash",
      "sell home",
      "sell property",
      "property sell",
      "home sell",
      "location",
      "motivated sellers",
      "sell for cash",
      "as is sale",
      "buy my house cash",
      "sell my house cash",
      "sell my home cash",
      "cash offer my home",
      "quick house sale",
      "fast home sale",
      "sell house fast",
      "home buyers",
      "we buy houses",
      "sell property quickly",
      "cash for homes",
      "buy houses fast",
      "sell property as is",
      "we buy any house",
      "cash house buyers",
      "sell your house today",
      "quick home sale",
      "urgent home sale",
      "sell house immediately",
      "property investors",
      "real estate investors",
      "cash home buyers",
      "sell without realtor",
      "sell house online",
      "instant cash offer",
      "sell property for cash",
      "house cash offer",
      "home cash offer",
      "sell house as is",
      "we buy houses cash",
      "sell house quick",
      "fast cash for house",
      "cash sale house",
      "sell home fast",
      "sell house no fees",
      "house buyers cash",
      "sell home without agent",
      "quick sale house",
      "fast property sale",
      "sell house no commission",
      "cash buyers for homes",
      "buy homes for cash",
      "sell house fast for cash",
      "sell house for quick cash",
      "buy property cash",
      "sell home quick",
      "real estate cash buyers",
      "quick cash offer",
      "sell property fast",
      "cash offer house",
      "sell home as is",
      "urgent property sale",
      "sell house fast no agent",
      "buy my house now",
      "sell house today cash",
      "property quick sale",
      "buy my house quickly",
      "fast home sale cash",
      "we buy homes cash"
    ];
  
    // Convert text to lower case for case-insensitive comparison
    const lowerCaseText = text.toLowerCase();
  
    // Check if any of the keywords are included in the text
    return keywords.some(keyword => lowerCaseText.includes(keyword));
  }
};

module.exports = CommentReader;
