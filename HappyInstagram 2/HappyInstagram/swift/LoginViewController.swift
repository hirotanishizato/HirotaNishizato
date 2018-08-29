//
//  LoginViewController.swift
//  HappyInstagram
//
//  Created by hirota.nishizato on 2018/08/28.
//  Copyright © 2018年 hirota.nishizato. All rights reserved.
//

import UIKit
import Firebase

class LoginViewController: UIViewController {

    
    @IBOutlet var emailTextField: UITextField!
    @IBOutlet var passwordTextField: UITextField!
    
    override func viewDidLoad() {
        super.viewDidLoad()

        // Do any additional setup after loading the view.
    }

    
    @IBAction func createNewUser(_ sender: Any) {
        
        //メールアドレスとパスワードが空の場合、何も起こらないようにしたい。
        if emailTextField.text == nil || passwordTextField.text == nil{
            let alertViewController = UIAlertController(title: "ops", message: "入力欄が空の状態です", preferredStyle:  .alert)
            let okAction = UIAlertAction(title: "OK", style: .default, handler: nil)
            alertViewController.addAction(okAction)
            //OKアクションをモーダルで出す
            present(alertViewController, animated: true, completion: nil)
        }else{
        Auth.auth().createUser(withEmail: emailTextField.text!, password: passwordTextField.text!, completion: {(user,error) in
            if error == nil{
                //成功
                UserDefaults.standard.set("check", forKey: "check")
                //画面を閉じて下さい
                self.dismiss(animated: true, completion: nil)
            } else{
                //失敗
                let alertViewController = UIAlertController(title: "ops", message: error?.localizedDescription, preferredStyle:  .alert)
                let okAction = UIAlertAction(title: "OK", style: .cancel, handler: nil)
                alertViewController.addAction(okAction)
                self.present(alertViewController, animated: true, completion: nil)
            }
        })
        }
    }

    @IBAction func userLogin(_ sender: Any) {
        Auth.auth().signIn(withEmail: emailTextField.text!, password: passwordTextField.text!, completion: {(user,error) in
            if error == nil{
            } else{
                let alertViewController = UIAlertController(title: "ops", message: error?.localizedDescription, preferredStyle:  .alert)
                let okAction = UIAlertAction(title: "OK", style: .cancel, handler: nil)
                alertViewController.addAction(okAction)
                self.present(alertViewController, animated: true, completion: nil)
            }
        })
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
