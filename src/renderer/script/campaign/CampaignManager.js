class CampaignManager {
  constructor() {
    this.campaigns = [];
    this.read();
    this.currentPosts = null;
  }

  async read() {
    const data = await ipcRenderer.invoke("fb-manager", { action: "read" });
    this.campaigns = data;
    this.render();
  }

  async write() {
    const status = await ipcRenderer.invoke("fb-manager", {
      action: "write",
      data: this.campaigns,
    });
    this.render();
  }

  generateRandomId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  }

  add(obj) {
    obj.id = this.generateRandomId();
    this.campaigns.push(obj);
    this.write();
    showNotification(
      svgConstants.success,
      "Success",
      "Your campaign has been added Successfully!",
      codeConstants.success
    );
  }

  resetCampaign(id) {
    let campaign = this.campaigns.find((campaign) => campaign.id == id);
    campaign.active = false;
    campaign.status = "new";
    this.write();
  }

  delete(id) {
    this.campaigns = this.campaigns.filter((campaign) => campaign.id != id);
    this.write();
  }

  handleOnUpdate(data) {
    let campaign = this.campaigns.find((campaign) => campaign.id == data.id);
    campaign.posts.push(data.post);
    this.write();
  }

  handleOnComplete(data) {
    let campaign = this.campaigns.find((campaign) => campaign.id == data.id);
    campaign.active = false;
    campaign.status = "completed";
    this.write();
  }

  handleOnError(data) {
    let campaign = this.campaigns.find((campaign) => campaign.id == data.id);
    campaign.active = false;
    campaign.status = "failed";
    this.write();
  }

  pause(id) {
    let campaign = this.campaigns.find((campaign) => campaign.id == id);
    ipcRenderer.invoke("fb-manager", { action: "refresh" });
    campaign.active = false;
    campaign.status = "incomplete";
    this.render();
    this.write();
  }

  run(id) {
    let found = this.campaigns.find((campaign) => campaign.active == true);
    if (found) {
      showNotification(
        svgConstants.warning,
        "Warning: ",
        "Only one campaign can be active at a time",
        codeConstants.warning
      );
      return;
    }
    let campaign = this.campaigns.find((campaign) => campaign.id == id);
    ipcRenderer.invoke("fb-manager", { action: "run", data: campaign });
    campaign.active = true;
    campaign.status = "running";
    this.render();
  }

  render() {
    this.renderStats();
    this.renderCampaigns();
    this.renderRecentsCampaign();
  }

  renderStats() {
    const completed = this.campaigns.filter(
      (campaign) => campaign.status === "completed"
    ).length;
    const newCampaigns = this.campaigns.filter(
      (campaign) => campaign.status === "new"
    ).length;
    const fails = this.campaigns.filter(
      (campaign) => campaign.status === "failed"
    ).length;
    const totalPosts = this.campaigns.reduce(
      (acc, campaign) => acc + campaign.posts.length,
      0
    );

    document.getElementById("stats_current_campaign").innerText = newCampaigns;
    document.getElementById("stats_total_comments").innerText = totalPosts;
    document.getElementById("stats_completed_campaign").innerText = completed;
    document.getElementById("stats_failed_campaign").innerText = fails;
  }

  formatDate(isoString) {
    const date = new Date(isoString);
    const options = {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    };
    return date.toLocaleString("en-US", options);
  }

  getTableActionButtonHtml(campaign) {
    let status = campaign.status;
    switch (status) {
      case "new":
        return ` <button class="btn" data-action="run" data-id="${campaign.id}" onclick="handleCampaignAction(this)">Run</button>`;
      case "running":
        return ` <button class="btn bg-info" data-action="pause" data-id="${campaign.id}" onclick="handleCampaignAction(this)">Pause</button>`;
      case "completed":
        return ` <button class="btn bg-green" data-action="restart" data-id="${campaign.id}" onclick="handleCampaignAction(this)">Restart</button>`;
      case "incomplete":
        return ` <button class="btn bg-green" data-action="run" data-id="${campaign.id}" onclick="handleCampaignAction(this)">Resume</button>`;
      case "failed":
        return ` <button class="btn bg-error" data-action="restart" data-id="${campaign.id}" onclick="handleCampaignAction(this)">Try Again</button>`;
    }
  }

  showPosts(id) {
    let campaign = this.campaigns.find((campaign) => campaign.id == id);
    this.currentPosts = campaign;
    this.renderPosts();
  }

  renderPosts(posts) {
    let campaign = this.currentPosts;
    if (!posts) {
      posts = this.currentPosts.posts;
    }

    let html = "";
    posts.forEach((post, index) => {
      if (post)
        html += `<tr>
           <td>${index}</td>
           <td>${this.formatDate(campaign.date)}</td>
           <td>${post.title}</td>
           <td>
           <div class="flex flex-center">
              <a class="svg-btn" href="${post.profile}"  target="_blank">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path  d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" /></svg>
              </a>
            </div>
           </td>

           <td>${post.comments?.length}</td>

           <td>
             <div class="flex flex-center">
               <button class="svg-btn bg-info" data-id="${
                 campaign.id
               }" data-keyId="${
          post.keyId
        }" data-action="comments" onclick="handlePostAction(this)" >
                 <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M240-400h480v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80Zm-80 400q-33 0-56.5-23.5T80-320v-480q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v720L720-240H160Z"/></svg>
                 <span class="counter-span">
                  ${post.comments.length}
                 </span>
               </button>
             </div>
           </td>


           <td>
             <div class="flex flex-center">
               <button class="btn">
               <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M240-160q-33 0-56.5-23.5T160-240q0-33 23.5-56.5T240-320q33 0 56.5 23.5T320-240q0 33-23.5 56.5T240-160Zm320 0q-33 0-56.5-23.5T480-240q0-33 23.5-56.5T560-320q33 0 56.5 23.5T640-240q0 33-23.5 56.5T560-160ZM400-320q-33 0-56.5-23.5T320-400q0-33 23.5-56.5T400-480q33 0 56.5 23.5T480-400q0 33-23.5 56.5T400-320Zm320 0q-33 0-56.5-23.5T640-400q0-33 23.5-56.5T720-480q33 0 56.5 23.5T800-400q0 33-23.5 56.5T720-320ZM240-480q-33 0-56.5-23.5T160-560q0-33 23.5-56.5T240-640q33 0 56.5 23.5T320-560q0 33-23.5 56.5T240-480Zm320 0q-33 0-56.5-23.5T480-560q0-33 23.5-56.5T560-640q33 0 56.5 23.5T640-560q0 33-23.5 56.5T560-480ZM400-640q-33 0-56.5-23.5T320-720q0-33 23.5-56.5T400-800q33 0 56.5 23.5T480-720q0 33-23.5 56.5T400-640Zm320 0q-33 0-56.5-23.5T640-720q0-33 23.5-56.5T720-800q33 0 56.5 23.5T800-720q0 33-23.5 56.5T720-640Z"/></svg>
                <p>Ask AI </p>
               </button>
             </div>
           </td>
         </tr>`;
    });

    document.getElementById("posts-panel").style.display = "flex";
    document.getElementById("posts-tbody").innerHTML = html;
  }

  showComments(campaignId, postId) {
    let campaign = this.campaigns.find((campaign) => campaign.id == campaignId);
    let currentPost = campaign.posts.find((post) => post.keyId == postId);
    this.currentComments = currentPost.comments;
    this.renderComments();
  }


  getCommentsHTML(comments){

    let html = "";
    comments.forEach((comment, index) => {
      if (comment)
        html += `<tr>
           <td>${index}</td>
           <td>
            <div class="table-img">
              <img src="${comment.img}">
            </div>
           </td>
           <td>${comment.name}</td>
           <td>
             <div class="flex flex-center">
                <a class="svg-btn" href="${comment.profile}"  target="_blank">
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path  d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" /></svg>
                </a>
              </div>
           </td>
           <td>
           <div class="flex flex-center">
              <div class="comment-container">
                ${comment.comment}
              </div>
            </div>
           </td>
         </tr>`;
    });

    return html;
  }

  renderComments(comments) {
    if (!comments) {
      comments = this.currentComments;
    }
    document.getElementById("comments-panel").style.display = "flex";
    document.getElementById("comments-tbody").innerHTML = this.getCommentsHTML(comments);
  }


  renderAllCommentsSection(){
    let allPosts = [];
    
    this.campaigns.forEach(cmp=>{
        allPosts.push(...cmp.posts)
    });

    let html  = ``;

    for(let i=0;i<allPosts.length;i++){

      html+=`
        <p class="table-h-txt">${allPosts[i].title}</p>
      <div class="table-parent">
                  
                            <table >
                                <thead>
                                    <tr>
                                        <th >
                                            ID
                                        </th>
                                        <th >
                                            Image
                                        </th>
                                        <th >
                                            Name
                                        </th>
                                        <th >
                                            Profile
                                        </th>
                                        <th >
                                            Comments
                                        </th>
                                    </tr>
                                </thead>
                                <tbody >
`
        html += this.getCommentsHTML(allPosts[i].comments);
        html+=`  </tbody>
              </table>
              </div>`
    }
    document.getElementById('comments-section-container').innerHTML = html;
  }

  generateCampaignRow(campaign, index) {
    if (!campaign) return "";
    return `
        <tr>
          <td>${index}</td>
          <td>${this.formatDate(campaign.date)}</td>
          <td>${campaign.name}</td>
          <td>${campaign.max}</td>
          <td>
          ${
            campaign.status == "running"
              ? ` 
                <div class="flex flex-row gap-lg flex-center">
                    <div class="lds-ring">
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                    Running
                </div> `
              : `${campaign.status}`
          }</td>
          <td>
            <div class="flex flex-center">
              <button class="svg-btn bg-info" data-id="${
                campaign.id
              }" data-action="posts" onclick="handleCampaignAction(this)" >
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
                  <path d="M280-240q-17 0-28.5-11.5T240-280v-80h520v-360h80q17 0 28.5 11.5T880-680v600L720-240H280ZM80-280v-560q0-17 11.5-28.5T120-880h520q17 0 28.5 11.5T680-840v360q0 17-11.5 28.5T640-440H240L80-280Z"/>
                </svg>

                <span class="counter-span">
                 ${campaign.posts.length}
                </span>
              </button>
            </div>
          </td>
          <td>
            <div class="flex flex-center">
               ${this.getTableActionButtonHtml(campaign)}
            </div>
          </td>
          <td>
            <div class="flex flex-center">
              <button data-id="${
                campaign.id
              }" data-action="delete" class="svg-btn bg-error" onclick="handleCampaignAction(this)">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
                  <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm80-160h80v-360h-80v360Zm160 0h80v-360h-80v360Z"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>`;
  }

  getEmptyHtml() {
    return `<div class="empty-table-container">
                    <span>
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
                        <path d="M320-160h320v-120q0-66-47-113t-113-47q-66 0-113 47t-47 113v120Zm160-360q66 0 113-47t47-113v-120H320v120q0 66 47 113t113 47ZM160-80v-80h80v-120q0-61 28.5-114.5T348-480q-51-32-79.5-85.5T240-680v-120h-80v-80h640v80h-80v120q0 61-28.5 114.5T612-480q51 32 79.5 85.5T720-280v120h80v80H160Z"/>
                    </svg>
                    </span>
                    <p>No Record Found</p>
                </div>`;
  }

  renderCampaigns(campaigns) {
    if(!campaigns)
      campaigns  =  this.campaigns;
    let html = campaigns
      .map((campaign, index) => this.generateCampaignRow(campaign, index))
      .join("");
    if (campaigns.length === 0) html = this.getEmptyHtml();
    document.getElementById("campaign-tbody").innerHTML = html;
  }

  renderRecentsCampaign() {
    const recentCampaigns = this.campaigns.filter(
      (campaign) => campaign.status === "new"
    );
    let html = recentCampaigns
      .map((campaign, index) => this.generateCampaignRow(campaign, index))
      .join("");
    if (recentCampaigns.length === 0) html = this.getEmptyHtml();
    document.getElementById("recent-campaign-tbody").innerHTML = html;
  }

  handleSearch(keyword) {
    if (keyword === "") {
      this.renderCampaigns();
    } else {
      const filtered = this.campaigns.filter((cam) =>
        cam.name.toLowerCase().includes(keyword.toLowerCase())
      );
      this.renderCampaigns(filtered);
    }
  }

  handlePostSearch(keyword) {
    if (keyword === "") {
      this.renderPosts();
    } else {
      const filtered = this.currentPosts.posts.filter((cam) =>
        cam?
        cam.title.toLowerCase().includes(keyword.toLowerCase()):false
      );
      this.renderPosts(filtered);
    }
  }

  handleCommentsSearch(keyword) {
    if (keyword === "") {
      this.renderComments();
    } else {
      const filtered = this.currentComments.filter(
        (cam) =>
          cam.name.toLowerCase().includes(keyword.toLowerCase()) ||
          cam.comment.toLowerCase().includes(keyword.toLowerCase())
      );
      this.renderComments(filtered);
    }
  }
}
