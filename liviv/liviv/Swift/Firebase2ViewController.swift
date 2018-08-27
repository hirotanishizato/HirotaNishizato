import UIKit
import Firebase

class Firebase2ViewController: UIViewController {

    @IBOutlet weak var TextLabel1: UILabel!
    @IBOutlet weak var TextLabel2: UILabel!
    @IBOutlet weak var TextLabel3: UILabel!
    
    //firebase
    var ref : DatabaseReference!
  
    override func viewDidLoad() {
        super.viewDidLoad()
        
        //firebaseから取得
        let defaultLabel1 = ref.child("user/01/price")
        defaultLabel1.observe(.value){
            (snap: DataSnapshot) in self.TextLabel1.text = (snap.value! as AnyObject).description}
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    


    
    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        // Get the new view controller using segue.destinationViewController.
        // Pass the selected object to the new view controller.
    }
    */

}
