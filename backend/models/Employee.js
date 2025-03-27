const pool = require('../config/database');
class Employee {
  static async findAll() {
    const query = `
      SELECT e.*, 
        d.disability_type, d.physical_verified, d.intellectual_verified, d.mental_verified,
        d.physical_degree_current, d.intellectual_degree_current, d.mental_degree_current
      FROM employees e
      LEFT JOIN disabilities d ON e.id = d.employee_id
      ORDER BY e.employee_id
    `;
    
    try {
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }
  
  static async findById(id) {
    const query = `
      SELECT e.*, 
        d.disability_type, d.physical_verified, d.intellectual_verified, d.mental_verified,
        d.physical_degree_current, d.intellectual_degree_current, d.mental_degree_current,
        d.certificate_number, d.expiry_date
      FROM employees e
      LEFT JOIN disabilities d ON e.id = d.employee_id
      WHERE e.id = $1
    `;
    
    try {
      const { rows } = await pool.query(query, [id]);
      if (rows.length === 0) return null;
      
      // 月次データの取得
      const monthlyQuery = `
        SELECT year, month, scheduled_hours, actual_hours, exception_reason
        FROM monthly_work_hours
        WHERE employee_id = $1
        ORDER BY year, month
      `;
      
      const monthlyResult = await pool.query(monthlyQuery, [id]);
      rows[0].monthlyData = monthlyResult.rows;
      
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  static async create(employeeData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 基本情報の登録
      const employeeQuery = `
        INSERT INTO employees 
        (employee_id, name, name_kana, gender, birth_date, hire_date, status, count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;
      
      const employeeValues = [
        employeeData.employee_id || `EMP${Date.now()}`, // 自動生成
        employeeData.name,
        employeeData.name_kana || '',
        employeeData.gender,
        employeeData.birth_date,
        employeeData.hire_date,
        employeeData.status || '在籍中',
        employeeData.count || 1.0
      ];
      
      const employeeResult = await client.query(employeeQuery, employeeValues);
      const employeeId = employeeResult.rows[0].id;
      
      // 障害情報の登録
      if (employeeData.disability_type) {
        const disabilityQuery = `
          INSERT INTO disabilities 
          (employee_id, disability_type, certificate_number, expiry_date,
           physical_verified, intellectual_verified, mental_verified)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        const disabilityValues = [
          employeeId,
          employeeData.disability_type,
          employeeData.certificate_number || null,
          employeeData.expiry_date || null,
          employeeData.physical_verified || false,
          employeeData.intellectual_verified || false,
          employeeData.mental_verified || false
        ];
        
        await client.query(disabilityQuery, disabilityValues);
      }
      
      // 月次データの登録（12ヶ月分）
      const currentYear = new Date().getFullYear();
      
      for (let month = 1; month <= 12; month++) {
        const monthlyQuery = `
          INSERT INTO monthly_work_hours 
          (employee_id, year, month, scheduled_hours, actual_hours)
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        await client.query(monthlyQuery, [
          employeeId,
          currentYear,
          month,
          160, // デフォルト値
          160  // デフォルト値
        ]);
      }
      
      await client.query('COMMIT');
      
      // 作成した従業員データを返す
      return this.findById(employeeId);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  static async update(id, employeeData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 基本情報の更新
      const employeeQuery = `
        UPDATE employees 
        SET 
          name = COALESCE($1, name), 
          name_kana = COALESCE($2, name_kana), 
          gender = COALESCE($3, gender), 
          birth_date = COALESCE($4, birth_date), 
          hire_date = COALESCE($5, hire_date),
          status = COALESCE($6, status),
          count = COALESCE($7, count),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
      `;
      
      const employeeValues = [
        employeeData.name,
        employeeData.name_kana,
        employeeData.gender,
        employeeData.birth_date,
        employeeData.hire_date,
        employeeData.status,
        employeeData.count,
        id
      ];
      
      await client.query(employeeQuery, employeeValues);
      
      // 障害情報の更新
      if (employeeData.disability_type) {
        // 既存の障害情報を確認
        const checkQuery = `SELECT * FROM disabilities WHERE employee_id = $1`;
        const checkResult = await client.query(checkQuery, [id]);
        
        if (checkResult.rows.length > 0) {
          // 更新
          const disabilityQuery = `
            UPDATE disabilities 
            SET 
              disability_type = COALESCE($1, disability_type),
              certificate_number = COALESCE($2, certificate_number),
              expiry_date = COALESCE($3, expiry_date),
              physical_verified = COALESCE($4, physical_verified),
              intellectual_verified = COALESCE($5, intellectual_verified),
              mental_verified = COALESCE($6, mental_verified),
              updated_at = CURRENT_TIMESTAMP
            WHERE employee_id = $7
          `;
          
          const disabilityValues = [
            employeeData.disability_type,
            employeeData.certificate_number,
            employeeData.expiry_date,
            employeeData.physical_verified,
            employeeData.intellectual_verified,
            employeeData.mental_verified,
            id
          ];
          
          await client.query(disabilityQuery, disabilityValues);
        } else {
          // 新規作成
          const disabilityQuery = `
            INSERT INTO disabilities 
            (employee_id, disability_type, certificate_number, expiry_date,
             physical_verified, intellectual_verified, mental_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;
          
          const disabilityValues = [
            id,
            employeeData.disability_type,
            employeeData.certificate_number || null,
            employeeData.expiry_date || null,
            employeeData.physical_verified || false,
            employeeData.intellectual_verified || false,
            employeeData.mental_verified || false
          ];
          
          await client.query(disabilityQuery, disabilityValues);
        }
      }
      
      // 月次データの更新（提供されている場合）
      if (employeeData.monthlyData && Array.isArray(employeeData.monthlyData)) {
        for (const monthData of employeeData.monthlyData) {
          if (!monthData.year || !monthData.month) continue;
          
          const monthlyQuery = `
            INSERT INTO monthly_work_hours 
            (employee_id, year, month, scheduled_hours, actual_hours, exception_reason)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (employee_id, year, month) 
            DO UPDATE SET 
              scheduled_hours = $4,
              actual_hours = $5,
              exception_reason = $6,
              updated_at = CURRENT_TIMESTAMP
          `;
          
          await client.query(monthlyQuery, [
            id,
            monthData.year,
            monthData.month,
            monthData.scheduled_hours || 160,
            monthData.actual_hours || 160,
            monthData.exception_reason || ''
          ]);
        }
      }
      
      await client.query('COMMIT');
      
      // 更新した従業員データを返す
      return this.findById(id);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  static async delete(id) {
    try {
      // 関連するデータは外部キー制約によりカスケード削除される
      await pool.query('DELETE FROM employees WHERE id = $1', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Employee;
