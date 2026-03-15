export function getToken(){
 return localStorage.getItem("token");
}

export function setToken(t){
 localStorage.setItem("token",t);
}