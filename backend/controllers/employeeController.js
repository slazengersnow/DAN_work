const Employee = require('../models/Employee');
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll();
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ success: false, message: '社員情報の取得中にエラーが発生しました' });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: '指定された社員が見つかりません' });
    }
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ success: false, message: '社員情報の取得中にエラーが発生しました' });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ success: false, message: '社員情報の作成中にエラーが発生しました' });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.update(req.params.id, req.body);
    if (!employee) {
      return res.status(404).json({ success: false, message: '指定された社員が見つかりません' });
    }
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ success: false, message: '社員情報の更新中にエラーが発生しました' });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    await Employee.delete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ success: false, message: '社員情報の削除中にエラーが発生しました' });
  }
};
