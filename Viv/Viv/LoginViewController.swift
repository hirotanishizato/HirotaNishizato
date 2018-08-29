import UIKit
import Firebase
import GoogleSignIn

//GIDSignInDelegateはgooglelogin用
class LoginViewController: UIViewController,GIDSignInDelegate,GIDSignInUIDelegate  {
    
    
    //*****BASE*****
    override func viewDidLoad() {
        super.viewDidLoad()
        //googlelogin
        GIDSignIn.sharedInstance().uiDelegate = self
        GIDSignIn.sharedInstance().delegate = self
        // *****TODO*****
        
        //(developer) Configure the sign-in button look/feel
        //ログインボタンに関する設定をここに記載すること
        
        // *****TODO*****

    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
    //*****BASE*****
    
    //googleloginボタンとの接続/カスタマイズ
    @IBOutlet weak var signInButton: GIDSignInButton!
    
    @IBAction func tapGoogleSignInButton(_ sender: Any) {
        GIDSignIn.sharedInstance().signIn()
    }
    
    //****************何を書けば良いのか？
    func sign(_ signIn: GIDSignIn!, didSignInFor user: GIDGoogleUser!, withError error: Error?) {
        // ...
        if let error = error {
            /*参考　http://jesus9387.hatenablog.com/entry/2017/09/08/124052
            エラーメッセージの記述*/
            print("エラー : \(error.localizedDescription)")
            return
        }
        guard let authentication = user.authentication else { return }
        // Googleのトークンを渡し、Firebaseクレデンシャルを取得する。
        let credential = GoogleAuthProvider.credential(withIDToken: authentication.idToken,
                                                       accessToken: authentication.accessToken)
        // Firebaseにログインする。
        Auth.auth().signIn(with: credential) { (user, error) in
            if let error = error {
                // ...
                return
            }
            print("ログインしました")
            // *****TODO*****
            
            //画面遷移処理
            
            // *****TODO*****
        }
        //ここ追加
        func sign(_ signIn: GIDSignIn!, didDisconnectWith user: GIDGoogleUser!, withError error: Error!) { print("Sign off successfully")
    }
}


}


