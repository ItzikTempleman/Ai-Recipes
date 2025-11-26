class AccountProtection{

public isUser():boolean{
    return !!localStorage.getItem("token"); 
}

}
export const accountProtection= new AccountProtection();