import UIKit
import Social

class SnsViewController: UIViewController {
    //投稿されている画像
    var detailImage = UIImage()
    
    //プロフィール画像
    var detailProfileImage = UIImage()
    var detailUserName = String()
    
    //投稿用の画面を初期化?
    var myComposeview:SLComposeViewController!
    
    @IBOutlet var profileImageView: UIImageView!
    @IBOutlet var label: UILabel!
    @IBOutlet var imageView: UIImageView!
    
    override func viewDidLoad() {
        super.viewDidLoad()

      
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        profileImageView.image = detailProfileImage
        profileImageView.layer.cornerRadius = 8.0
        profileImageView.clipsToBounds = true
        label.text = detailUserName
        imageView.image = detailImage
    }
    
    @IBAction func shareTwitter(_ sender: Any) {
       myComposeview = SLComposeViewController(forServiceType: SLServiceTypeTwitter)
        //投稿するテキスト
        let string = "#Happyinstagram"+" photo by " + label.text!
        myComposeview.setInitialText(string)
        myComposeview.add(imageView.image)
        //myComposeviewを表示する
        self.present(myComposeview, animated: true, completion: nil)
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
}
