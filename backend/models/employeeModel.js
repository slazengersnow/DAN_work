// models/employeeModel.js

const db = require('../config/db');

const employeeModel = {
  // 全従業員の取得
  getAllEmployees: async () => {
    try {
      const result = await db.query(`
        SELECT 
          e.*, 
          CASE 
            WHEN d.disability_id IS NOT NULL THEN true 
            ELSE false 
          END AS has_disability
        FROM 
          employees e
        LEFT JOIN 
          disabilities d ON e.id = d.employee_id
        ORDER BY 
          e.employee_id ASC
      `);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // ID別従業員取得
  getEmployeeById: async (id) => {
    try {
      const result = await db.query(`
        SELECT 
          e.*, 
          d.disability_type, 
          d.disability_grade, 
          d.certificate_number, 
          d.certificate_date, 
          d.expiration_date
        FROM 
          employees e
        LEFT JOIN 
          disabilities d ON e.id = d.employee_id
        WHERE 
          e.id = $1
      `, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // 従業員追加
  createEmployee: async (employeeData) => {
    const {
      employee_id,
      name,
      gender,
      birth_date,
      department,
      position,
      employment_status,
      joining_date,
      disability_info,
      notes
    } = employeeData;

    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 従業員情報の追加
      const employeeResult = await client.query(
        `INSERT INTO employees (
          employee_id, name, gender, birth_date, department, position, 
          employment_status, joining_date, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING id`,
        [employee_id, name, gender, birth_date, department, position, 
         employment_status, joining_date, notes]
      );
      
      const newEmployeeId = employeeResult.rows[0].id;
      
      // 障害情報がある場合、障害情報も追加
      if (disability_info) {
        await client.query(
          `INSERT INTO disabilities (
            employee_id, disability_type, disability_grade, 
            certificate_number, certificate_date, expiration_date, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [newEmployeeId, disability_info.disability_type, disability_info.disability_grade,
           disability_info.certificate_number, disability_info.certificate_date,
           disability_info.expiration_date, disability_info.notes]
        );
      }
      
      await client.query('COMMIT');
      
      return await this.getEmployeeById(newEmployeeId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 従業員更新
  updateEmployee: async (id, employeeData) => {
    const {
      employee_id,
      name,
      gender,
      birth_date,
      department,
      position,
      employment_status,
      joining_date,
      disability_info,
      notes
    } = employeeData;

    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 従業員情報の更新
      await client.query(
        `UPDATE employees SET
          employee_id = $1, name = $2, gender = $3, birth_date = $4,
          department = $5, position = $6, employment_status = $7,
          joining_date = $8, notes = $9, updated_at = NOW()
         WHERE id = $10`,
        [employee_id, name, gender, birth_date, department, position,
         employment_status, joining_date, notes, id]
      );
      
      // 障害情報の更新
      if (disability_info) {
        const disabilityExists = await client.query(
          'SELECT 1 FROM disabilities WHERE employee_id = $1',
          [id]
        );
        
        if (disabilityExists.rows.length > 0) {
          await client.query(
            `UPDATE disabilities SET
              disability_type = $1, disability_grade = $2,
              certificate_number = $3, certificate_date = $4,
              expiration_date = $5, notes = $6, updated_at = NOW()
             WHERE employee_id = $7`,
            [disability_info.disability_type, disability_info.disability_grade,
             disability_info.certificate_number, disability_info.certificate_date,
             disability_info.expiration_date, disability_info.notes, id]
          );
        } else {
          await client.query(
            `INSERT INTO disabilities (
              employee_id, disability_type, disability_grade,
              certificate_number, certificate_date, expiration_date, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [id, disability_info.disability_type, disability_info.disability_grade,
             disability_info.certificate_number, disability_info.certificate_date,
             disability_info.expiration_date, disability_info.notes]
          );
        }
      }
      
      await client.query('COMMIT');
      
      return await this.getEmployeeById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 従業員削除
  deleteEmployee: async (id) => {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 関連する障害情報を先に削除
      await client.query('DELETE FROM disabilities WHERE employee_id = $1', [id]);
      
      // 従業員を削除
      const result = await client.query(
        'DELETE FROM employees WHERE id = $1 RETURNING *',
        [id]
      );
      
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 統計情報の取得
  getEmployeeStats: async () => {
    try {
      const result = await db.query(`
        SELECT
          COUNT(*) as total_employees,
          COUNT(CASE WHEN d.disability_id IS NOT NULL THEN 1 END) as disabled_employees,
          ROUND(COUNT(CASE WHEN d.disability_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as disability_rate
        FROM
          employees e
        LEFT JOIN
          disabilities d ON e.id = d.employee_id
      `);
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // 部門別従業員情報
  getEmployeesByDepartment: async () => {
    try {
      const result = await db.query(`
        SELECT
          department,
          COUNT(*) as total,
          COUNT(CASE WHEN d.disability_id IS NOT NULL THEN 1 END) as disabled,
          ROUND(COUNT(CASE WHEN d.disability_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as rate
        FROM
          employees e
        LEFT JOIN
          disabilities d ON e.id = d.employee_id
        GROUP BY
          department
        ORDER BY
          total DESC
      `);
      
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = employeeModel;