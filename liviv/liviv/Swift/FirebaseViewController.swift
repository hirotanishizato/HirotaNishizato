import UIKit
import Firebase

class FirebaseViewController: UIViewController {

    //プロジェクト
    @IBOutlet var ProjectTextField: UITextField!
    //投票先
    @IBOutlet var NumberTextField: UITextField!
    //金額
    @IBOutlet var PriceTextField: UITextField!
    //Firebase
    var ref: DatabaseReference!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        ref = Database.database().reference()
    }

    @IBAction func Add01(_ sender: Any) {
        let projecttext = ProjectTextField.text!
        let numbertext = NumberTextField.text!
        let data = ["price" : PriceTextField.text!]
        ref.child("user/\(numbertext)").setValue(data)
        ref.child("projext/\(projecttext)").setValue(data)
    }
    
    @IBAction func Add02(_ sender: Any) {
        let data = ["price" : PriceTextField.text!]
        ref.child("user/02").setValue(data)
    }
    
    @IBAction func Add03(_ sender: Any) {
        let data = ["price" : PriceTextField.text!]
        ref.child("user/03").setValue(data)
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
