import UIKit
import Firebase

class EditViewController: UIViewController,UITextViewDelegate {

    //画像を受け取る変数
    var willEditImage: UIImage = UIImage()
    
    //アプリ内に保存されたユーザー名を取得
    var usernameString:String = String()

    @IBOutlet var myprofileImageView: UIImageView!
    @IBOutlet var myProfileLabel: UILabel!
    @IBOutlet var imageView: UIImageView!
    @IBOutlet var commentTextView: UITextView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
    imageView.image = willEditImage
    commentTextView.delegate = self
    myprofileImageView.layer.cornerRadius = 8.0
    myprofileImageView.clipsToBounds = true
        
    //settingでdoneを実行した際に保存した物を色々と取り出す
        if UserDefaults.standard.object(forKey: "profileImage") != nil{
            //エンコードして取り出す
            let decodeData = UserDefaults.standard.object(forKey: "profileImage")
            let decodedData = NSData(base64Encoded: decodeData as! String, options: NSData.Base64DecodingOptions.ignoreUnknownCharacters)
            let decodedImage = UIImage(data: decodedData! as Data)
            myprofileImageView.image = decodedImage
            usernameString = UserDefaults.standard.object(forKey: "userName") as! String
            myProfileLabel.text = usernameString
        }else{
            //保存されていない場合、匿名とする
            myprofileImageView.image = UIImage(named: "logo.png")
            myProfileLabel.text = "unknown"
        }
    }

    @IBAction func post(_ sender: Any) {
        postAll()
    }
    
    func postAll(){
        //初期化
        let databaseRef = Database.database().reference()
        //ユーザー名
        let username = myProfileLabel.text!
        //コメント
        let message = commentTextView.text!
        //投稿画像
        var data:NSData = NSData()
        if let image = imageView.image{
            //圧縮する
            data = UIImageJPEGRepresentation(image, 0.1)! as NSData
        }
        let base64String = data.base64EncodedString(options:NSData.Base64EncodingOptions.lineLength64Characters) as String
        
        //プロフィール画像
        var data2:NSData = NSData()
        if let image2 = myprofileImageView.image{
        data2 = UIImageJPEGRepresentation(image2, 0.1)! as NSData
        }
        let base64String2 = data2.base64EncodedString(options:NSData.Base64EncodingOptions.lineLength64Characters) as String
        
        //サーバーに飛ばす箱
        let user:NSDictionary = ["username":username,"comment":message,"postImage":base64String,"profileImage":base64String2]
        //サーバーに飛ばす
        databaseRef.child("Posts").childByAutoId().setValue(user)
        //飛ばしたら戻る
        self.navigationController?.popToRootViewController(animated: true)
}
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
}
