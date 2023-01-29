let userinfo = null;

function loadPermissions(){
    var url = `/api/vip/info`;
    var method = "GET";

    $.ajax(url, {
      method: method,
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      success: (res) => {
        userinfo = res;
      },
      error: (res) => {
        
      },
    });
}
$(()=>{
    loadPermissions()
})
