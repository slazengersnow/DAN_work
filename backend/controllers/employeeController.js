// PostgreSQLデータベース接続をインポート
const { pool } = require('../config/db');

const employeeController = {
  // 全従業員情報の取得
  getAllEmployees: async (req, res) => {
    try {
      const { year } = req.query;
      
      // 年度によるフィルタリング
      const query = year 
        ? `SELECT * FROM employees WHERE fiscal_year = $1 ORDER BY employee_id ASC`
        : `SELECT * FROM employees ORDER BY employee_id ASC`;
      
      const values = year ? [year] : [];
      const result = await pool.query(query, values);
      
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('従業員情報の取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '従業員情報の取得に失敗しました' });
    }
  },

  // ID別従業員情報の取得
  getEmployeeById: async (req, res) => {
    const { id } = req.params;
    
    try {
      const query = `SELECT * FROM employees WHERE id = $1`;
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: '従業員が見つかりません' });
      }
      
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('従業員情報の取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '従業員情報の取得に失敗しました' });
    }
  },

  // 従業員情報の作成
  createEmployee: async (req, res) => {
    try {
      const employeeData = req.body;
      
      // リクエストボディが空でないか確認
      if (!employeeData || Object.keys(employeeData).length === 0) {
        console.log('リクエストボディが空です:', req.body);
        return res.status(400).json({ error: '従業員データが提供されていません' });
      }
      
      // デバッグログ
      console.log('受信した従業員データ:', employeeData);
      
      // バリデーション
      if (!employeeData.name) {
        return res.status(400).json({ error: '従業員名は必須です' });
      }
      
      // 従業員データをデータベースに挿入
      const columns = Object.keys(employeeData).join(', ');
      const placeholders = Object.keys(employeeData).map((_, index) => `$${index + 1}`).join(', ');
      const values = Object.values(employeeData);
      
      const query = `
        INSERT INTO employees (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      const newEmployee = result.rows[0];
      
      res.status(201).json({
        message: '従業員情報を作成しました',
        employee: newEmployee
      });
    } catch (error) {
      console.error('従業員情報の作成中にエラーが発生しました:', error);
      res.status(500).json({ error: '従業員情報の作成に失敗しました' });
    }
  },

  // 従業員情報の更新
  updateEmployee: async (req, res) => {
    try {
      const { id } = req.params;
      console.log('更新リクエスト - ID:', id);
      console.log('更新データ:', req.body);
      
      const employeeData = req.body;
      
      // 従業員の存在確認
      const checkQuery = `SELECT * FROM employees WHERE id = $1`;
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: '従業員が見つかりません' });
      }
      
      // バリデーション
      if (!employeeData.name || !employeeData.employee_id) {
        return res.status(400).json({ error: '従業員IDと氏名は必須です' });
      }
      
      // 更新するフィールドと値の生成
      const updateFields = Object.keys(employeeData)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');
      const values = [...Object.values(employeeData), id];
      
      // 更新クエリの実行
      const query = `
        UPDATE employees
        SET ${updateFields}
        WHERE id = $${Object.keys(employeeData).length + 1}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      const updatedEmployee = result.rows[0];
      
      res.status(200).json(updatedEmployee);
    } catch (error) {
      console.error('従業員情報の更新中にエラーが発生しました:', error);
      // エラーの詳細を返す
      res.status(500).json({ 
        error: '従業員情報の更新に失敗しました', 
        details: error.message,
        code: error.code
      });
    }
  },

  // 従業員情報の削除
  deleteEmployee: async (req, res) => {
    const { id } = req.params;
    
    try {
      // 従業員の存在確認
      const checkQuery = `SELECT * FROM employees WHERE id = $1`;
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: '従業員が見つかりません' });
      }
      
      // 削除クエリの実行
      const query = `DELETE FROM employees WHERE id = $1 RETURNING *`;
      const result = await pool.query(query, [id]);
      
      res.status(200).json({
        message: '従業員情報を削除しました',
        employee: result.rows[0]
      });
    } catch (error) {
      console.error('従業員情報の削除中にエラーが発生しました:', error);
      res.status(500).json({ error: '従業員情報の削除に失敗しました' });
    }
  },

  // 従業員統計情報の取得
  getEmployeeStats: async (req, res) => {
    try {
      const { year } = req.query;
      
      // 年度によるフィルタリング条件
      const whereClause = year ? `WHERE fiscal_year = $1` : '';
      const values = year ? [year] : [];
      
      // 全従業員数
      const totalQuery = `SELECT COUNT(*) FROM employees ${whereClause}`;
      const totalResult = await pool.query(totalQuery, values);
      const totalEmployees = parseInt(totalResult.rows[0].count);
      
      // 部門ごとの従業員数
      const deptQuery = `
        SELECT department, COUNT(*) as count
        FROM employees
        ${whereClause}
        GROUP BY department
      `;
      const deptResult = await pool.query(deptQuery, values);
      
      // 役職ごとの従業員数
      const positionQuery = `
        SELECT position, COUNT(*) as count
        FROM employees
        ${whereClause}
        GROUP BY position
      `;
      const positionResult = await pool.query(positionQuery, values);
      
      res.status(200).json({
        totalEmployees,
        departmentCounts: deptResult.rows,
        positionCounts: positionResult.rows
      });
    } catch (error) {
      console.error('従業員統計情報の取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '従業員統計情報の取得に失敗しました' });
    }
  },

  // 部門別従業員情報の取得
  getEmployeesByDepartment: async (req, res) => {
    try {
      const { year } = req.query;
      
      // 年度によるフィルタリング条件
      const whereClause = year ? `WHERE fiscal_year = $1` : '';
      const values = year ? [year] : [];
      
      // 部門ごとの従業員リスト
      const query = `
        SELECT 
          d.id, 
          d.name,
          (
            SELECT json_agg(e) 
            FROM employees e 
            WHERE e.department_id = d.id ${whereClause ? 'AND ' + whereClause.replace('WHERE', '') : ''}
          ) as employees
        FROM departments d
      `;
      
      const result = await pool.query(query, values);
      
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('部門別従業員情報の取得中にエラーが発生しました:', error);
      res.status(500).json({ error: '部門別従業員情報の取得に失敗しました' });
    }
  }
};

module.exports = employeeController;