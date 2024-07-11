const { ipcRenderer } = require("electron");
let campaignManager = new CampaignManager();

function openModal(type) {
  let modal = document.getElementById("general-modal");
  let html = "";
  let callback = null;
  if (type == "campaign") {
    html = `
            <div class="modal-content flex-col gap-lg">
                <div class="modal-span">
                    <span>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"
                            fill="#e8eaed">
                            <path
                                d="M720-440v-80h160v80H720Zm48 280-128-96 48-64 128 96-48 64Zm-80-480-48-64 128-96 48 64-128 96ZM200-200v-160h-40q-33 0-56.5-23.5T80-440v-80q0-33 23.5-56.5T160-600h160l200-120v480L320-360h-40v160h-80Zm360-146v-268q27 24 43.5 58.5T620-480q0 41-16.5 75.5T560-346Z" />
                        </svg>
                    </span>
                </div>


                <div class="w-full flex flex-col gap-sm">
                    <p>Campaign name</p>
                    <input id="campaign-name" type="text" placeholder="my_campaign" class="basic-input">
                </div>

                <div class="w-full flex flex-col gap-sm">
                    <p>At least how many Ads you want to get comments</p>
                    <div class="select" style="width: 100%;">
                        <select id="campaign-select">
                            <option> 5 </option>
                            <option> 15 </option>
                            <option> 35 </option>
                            <option> 45 </option>
                            <option> 50 </option>
                        </select>
                    </div>
                </div>

                <div class="flex flex-row gap-lg w-full">
                    <button class="btn grow" id="modal-action">
                        Create
                    </button>
                    <button class="btn" id="modal-close" style="background-color: var(--error);">
                        Cancel
                    </button>
                </div>
            </div>`;

    callback = () => {
      let name = modal.querySelector("#campaign-name").value;
      let max = modal.querySelector("#campaign-select").value;
      let date = new Date().toISOString();
      let status = 'new';
      campaignManager.add({name: name, max: max,date: date, status: status,posts:[],active:false})
    };
  }

  modal.innerHTML = html;
  modal.style.display = "flex";
  modal.querySelector("#modal-close").addEventListener("click", (e) => {
    modal.style.display = "none";
    modal.innerHTML = "";
  });

  modal.querySelector("#modal-action").addEventListener("click", (e) => {
    callback();
    modal.style.display = "none";
    modal.innerHTML = "";
  });
}




  
function handleCampaignAction(el){
  let id = el.getAttribute("data-id");
  let action = el.getAttribute("data-action");
  switch (action) {
   case "delete":{
      campaignManager.delete(id);
   }break;
   case 'run':{
    campaignManager.run(id);
    openPanel('campaign-section')
   }break;
   case 'pause':{
    campaignManager.pause(id);
   }break;

   case 'restart':{
    campaignManager.run(id);
   }break;

   case 'posts':{
    campaignManager.showPosts(id);
   }break;
  }
}

function  handlePostAction(el){
  let id = el.getAttribute("data-id");
  let keyId = el.getAttribute("data-keyId");
  let action = el.getAttribute("data-action");
  switch(action){
    case 'comments':{
      campaignManager.showComments(id,keyId);
    }break;
  }


}

function openPanel(id,el=null) {
  document.querySelectorAll("div[data-panel]").forEach((panel) => {
    if (panel.id == id) {
      panel.style.display = "flex";
    } else {
      panel.style.display = "none";
    }
  });


  if(el){
    document.querySelectorAll('.side-bar-btn').forEach((btn) => {
      if(btn==el){
        btn.classList.add("active");
      }else{
        btn.classList.remove("active");
      }
    });
  }

  if(id=='comments-section'){
     campaignManager.renderAllCommentsSection()
  }

  if (id == "facebook-section") {
    ipcRenderer.invoke("fb-manager", { action: "show" });
  } else {
    ipcRenderer.invoke("fb-manager", { action: "hide" });
  }
}

function closeApplication() {
  ipcRenderer.send("close-app");
}




function handleCampaingSearch(el){
  let keyword = el.value.trim();
  campaignManager.handleSearch(keyword)
}


function handlePostSearch(el){
  let keyword = el.value.trim();
  campaignManager.handlePostSearch(keyword)
}

function handleCommentsSearch(el){
  let keyword = el.value.trim();
  campaignManager.handleCommentsSearch(keyword)
}


function closePanel(id){
  document.getElementById(id).style.display = "none";
}

 

ipcRenderer.on('login-required',(e,data)=>{

  if(data && data.id)
  campaignManager.resetCampaign(data.id);
  showNotification(svgConstants.warning,"Login","Please login first before Running the Campaign",codeConstants.warning);
  openPanel('facebook-section');
})


ipcRenderer.on('onupdate',(e,data)=>{
   campaignManager.handleOnUpdate(data);
});


ipcRenderer.on('oncomplete',(e,data)=>{
  campaignManager.handleOnComplete(data);
  showNotification(svgConstants.success,"Success","Campaign is completed Successfully!",codeConstants.success);

});

ipcRenderer.on('onerror',(e,data)=>{
  campaignManager.handleOnError(data);
  showNotification(svgConstants.error,"Error",data.message,codeConstants.error);
});
