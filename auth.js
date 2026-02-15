// auth.js - Hệ thống quản lý tài khoản cho Flappy Brain
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.isLoggedIn = false;
    }

    // Tải danh sách người dùng từ localStorage
    loadUsers() {
        const usersJSON = localStorage.getItem('flappyBrainUsers');
        return usersJSON ? JSON.parse(usersJSON) : [];
    }

    // Lưu danh sách người dùng vào localStorage
    saveUsers() {
        localStorage.setItem('flappyBrainUsers', JSON.stringify(this.users));
    }

    // Kiểm tra username đã tồn tại chưa
    usernameExists(username) {
        return this.users.some(user => user.username.toLowerCase() === username.toLowerCase());
    }

    // Đăng ký tài khoản mới
    register(username, password, birthDate, gender) {
        // Kiểm tra đầu vào
        if (!username || !password || !birthDate || !gender) {
            return { success: false, message: 'Vui lòng điền đầy đủ thông tin' };
        }

        // Kiểm tra username
        if (username.length < 3 || username.length > 20) {
            return { success: false, message: 'Tên đăng nhập phải từ 3-20 ký tự' };
        }

        if (this.usernameExists(username)) {
            return { success: false, message: 'Tên đăng nhập đã tồn tại' };
        }

        // Kiểm tra mật khẩu
        if (password.length < 6) {
            return { success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
        }

        // Kiểm tra ngày sinh
        const birthDateObj = new Date(birthDate);
        const today = new Date();
        const age = today.getFullYear() - birthDateObj.getFullYear();
        
        if (age < 6) {
            return { success: false, message: 'Bạn phải từ 6 tuổi trở lên' };
        }
        if (age > 100) {
            return { success: false, message: 'Ngày sinh không hợp lệ' };
        }

        // Tạo tài khoản mới
        const newUser = {
            id: Date.now().toString(),
            username: username.trim(),
            password: this.hashPassword(password),
            birthDate: birthDate,
            gender: gender,
            createdAt: new Date().toISOString(),
            stats: {
                gamesPlayed: 0,
                bestScore: 0,
                totalScore: 0,
                questionsAnswered: 0,
                correctAnswers: 0,
                totalQuestions: 0,
                subjectStats: {},
                achievements: [],
                skillAssessment: {
                    overall: 0,
                    subjects: {},
                    lastUpdated: null
                }
            },
            settings: {
                volume: 0.8,
                soundEnabled: true,
                gameSpeed: 1.0,
                difficulty: 'easy',
                language: 'vi',
                birdColor: 0,
                bgColor: 0,
                showExplanations: true,
                autoContinue: false
            }
        };

        // Thêm vào danh sách
        this.users.push(newUser);
        this.saveUsers();

        // Tự động đăng nhập
        this.currentUser = newUser;
        this.isLoggedIn = true;
        this.saveCurrentUser();

        return { 
            success: true, 
            message: 'Đăng ký thành công!',
            user: newUser 
        };
    }

    // Đăng nhập
    login(username, password) {
        const user = this.users.find(u => 
            u.username.toLowerCase() === username.toLowerCase()
        );

        if (!user) {
            return { success: false, message: 'Tài khoản không tồn tại' };
        }

        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: 'Mật khẩu không đúng' };
        }

        this.currentUser = user;
        this.isLoggedIn = true;
        this.saveCurrentUser();

        return { 
            success: true, 
            message: 'Đăng nhập thành công!',
            user: user 
        };
    }

    // Đăng xuất
    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        localStorage.removeItem('flappyBrainCurrentUser');
        return { success: true, message: 'Đã đăng xuất' };
    }

    // Lưu thông tin người dùng hiện tại
    saveCurrentUser() {
        if (this.currentUser) {
            localStorage.setItem('flappyBrainCurrentUser', JSON.stringify(this.currentUser));
        }
    }

    // Tải thông tin người dùng hiện tại
    loadCurrentUser() {
        const userJSON = localStorage.getItem('flappyBrainCurrentUser');
        if (userJSON) {
            this.currentUser = JSON.parse(userJSON);
            this.isLoggedIn = true;
            return this.currentUser;
        }
        return null;
    }

    // Cập nhật thống kê câu hỏi
    updateQuestionStats(subject, isCorrect) {
        if (!this.currentUser) return;
        
        // Tăng tổng số câu hỏi đã trả lời
        this.currentUser.stats.questionsAnswered++;
        this.currentUser.stats.totalQuestions++;
        
        // Tăng số câu đúng nếu đáp án đúng
        if (isCorrect) {
            this.currentUser.stats.correctAnswers++;
        }
        
        // Cập nhật thống kê theo môn học
        if (!this.currentUser.stats.subjectStats[subject]) {
            this.currentUser.stats.subjectStats[subject] = {
                answered: 0,
                correct: 0,
                total: 0
            };
        }
        
        this.currentUser.stats.subjectStats[subject].answered++;
        this.currentUser.stats.subjectStats[subject].total++;
        if (isCorrect) {
            this.currentUser.stats.subjectStats[subject].correct++;
        }
        
        // Cập nhật đánh giá năng lực
        this.updateSkillAssessment();
        
        this.saveUserData();
    }

    // Cập nhật điểm cao nhất
    updateBestScore(score) {
        if (!this.currentUser) return;
        
        if (score > this.currentUser.stats.bestScore) {
            this.currentUser.stats.bestScore = score;
            this.saveUserData();
        }
    }

    // Cập nhật số lần chơi và tổng điểm
    updateGameStats(score) {
        if (!this.currentUser) return;
        
        this.currentUser.stats.gamesPlayed++;
        this.currentUser.stats.totalScore += score;
        this.saveUserData();
    }

    // Cập nhật cài đặt
    updateSettings(newSettings) {
        if (!this.currentUser) return;
        
        Object.assign(this.currentUser.settings, newSettings);
        this.saveUserData();
    }

    // Lấy cài đặt
    getUserSettings() {
        return this.currentUser ? this.currentUser.settings : null;
    }

    // Lưu dữ liệu người dùng
    saveUserData() {
        if (!this.currentUser) return;
        
        // Cập nhật trong danh sách users
        const index = this.users.findIndex(u => u.id === this.currentUser.id);
        if (index !== -1) {
            this.users[index] = this.currentUser;
            this.saveUsers();
            this.saveCurrentUser();
        }
    }

    // Hàm băm mật khẩu đơn giản
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    // Lấy thông tin người dùng
    getUserInfo() {
        if (!this.currentUser) return null;
        
        const birthDate = new Date(this.currentUser.birthDate);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        return {
            username: this.currentUser.username,
            birthDate: this.currentUser.birthDate,
            age: age,
            gender: this.currentUser.gender,
            joinDate: new Date(this.currentUser.createdAt).toLocaleDateString('vi-VN'),
            stats: { ...this.currentUser.stats }
        };
    }

    // Cập nhật đánh giá năng lực
    updateSkillAssessment() {
        if (!this.currentUser) return;
        
        const stats = this.currentUser.stats;
        const subjectStats = stats.subjectStats;
        
        // Tính toán điểm tổng thể
        let overallScore = 0;
        let subjectScores = {};
        let totalWeight = 0;
        
        // Điểm cơ bản dựa trên tỷ lệ đúng
        if (stats.totalQuestions > 0) {
            const accuracy = (stats.correctAnswers / stats.totalQuestions) * 100;
            overallScore = accuracy;
        }
        
        // Thêm điểm cho mỗi môn học
        for (const [subject, data] of Object.entries(subjectStats)) {
            if (data.total > 0) {
                const subjectAccuracy = (data.correct / data.total) * 100;
                subjectScores[subject] = Math.round(subjectAccuracy);
                
                // Môn học càng nhiều câu hỏi càng có trọng số cao
                const weight = Math.min(data.total / 10, 1);
                overallScore = overallScore * 0.7 + subjectAccuracy * 0.3 * weight;
                totalWeight += weight;
            }
        }
        
        // Điều chỉnh điểm nếu có nhiều môn học
        if (totalWeight > 0) {
            overallScore = Math.min(overallScore, 100);
        }
        
        // Phân loại năng lực
        let assessment = '';
        if (overallScore >= 90) assessment = 'Xuất sắc';
        else if (overallScore >= 80) assessment = 'Giỏi';
        else if (overallScore >= 70) assessment = 'Khá';
        else if (overallScore >= 50) assessment = 'Trung bình';
        else assessment = 'Cần cố gắng';
        
        // Lưu kết quả đánh giá
        stats.skillAssessment = {
            overall: Math.round(overallScore),
            subjects: subjectScores,
            assessment: assessment,
            lastUpdated: new Date().toISOString()
        };
        
        this.saveUserData();
    }

    // Lấy đánh giá năng lực
    getSkillAssessment() {
        if (!this.currentUser) return null;
        
        return this.currentUser.stats.skillAssessment;
    }

    // Lấy thống kê chi tiết
    getDetailedStats() {
        if (!this.currentUser) return null;
        
        const stats = this.currentUser.stats;
        const accuracy = stats.questionsAnswered > 0 ? 
            Math.round((stats.correctAnswers / stats.questionsAnswered) * 100) : 0;
        
        return {
            basic: {
                gamesPlayed: stats.gamesPlayed,
                bestScore: stats.bestScore,
                totalScore: stats.totalScore,
                questionsAnswered: stats.questionsAnswered,
                correctAnswers: stats.correctAnswers,
                accuracy: accuracy
            },
            subjects: stats.subjectStats,
            assessment: stats.skillAssessment
        };
    }

    // Xóa tài khoản
    deleteAccount(password) {
        if (!this.currentUser) {
            return { success: false, message: 'Chưa đăng nhập' };
        }

        if (this.currentUser.password !== this.hashPassword(password)) {
            return { success: false, message: 'Mật khẩu không đúng' };
        }

        // Xóa khỏi danh sách
        this.users = this.users.filter(u => u.id !== this.currentUser.id);
        this.saveUsers();
        
        // Đăng xuất
        this.logout();
        
        return { success: true, message: 'Đã xóa tài khoản thành công' };
    }
}

// Khởi tạo hệ thống auth
const auth = new AuthSystem();