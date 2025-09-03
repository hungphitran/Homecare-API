require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import models
const Service = require('../model/service.model');
const Helper = require('../model/helper.model');
const Customer = require('../model/customer.model');
const Staff = require('../model/staff.model');
const Location = require('../model/location.model');
const Blog = require('../model/blog.model');
const Policy = require('../model/policy.model');
const Question = require('../model/question.model');
const DeviceToken = require('../model/deviceToken.model');
const CostFactorType = require('../model/costFactorType.model');
const Role = require('../model/role.model');

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/homecare');
        console.log('Connected to MongoDB');

        console.log('Starting to seed database...\n');

        // 1. Seed Roles first (needed for staff)
        console.log('1. Seeding Roles...');
        const roles = [
            {
                title: "Admin",
                description: "Quản trị viên hệ thống",
                permissions: ["all"],
                deleted: false,
                createdBy: {
                    account_id: "system",
                    createdAt: new Date()
                }
            },
            {
                title: "Manager",
                description: "Quản lý",
                permissions: ["manage_staff", "manage_requests", "view_reports"],
                deleted: false,
                createdBy: {
                    account_id: "system",
                    createdAt: new Date()
                }
            },
            {
                title: "Staff",
                description: "Nhân viên",
                permissions: ["view_requests", "update_requests"],
                deleted: false,
                createdBy: {
                    account_id: "system",
                    createdAt: new Date()
                }
            }
        ];
        
        const insertedRoles = await Role.insertMany(roles);
        console.log(`✓ Inserted ${insertedRoles.length} roles`);

        // 2. Seed Cost Factor Types
        console.log('2. Seeding Cost Factor Types...');
        const costFactorTypes = [
            {
                title: "Hệ số theo thời gian",
                description: "Áp dụng hệ số theo khung giờ làm việc",
                coefficientList: [
                    {
                        title: "Giờ hành chính",
                        description: "8h - 17h các ngày trong tuần",
                        value: 1.0,
                        deleted: false,
                        status: "active"
                    },
                    {
                        title: "Ngoài giờ hành chính",
                        description: "17h - 22h các ngày trong tuần",
                        value: 1.2,
                        deleted: false,
                        status: "active"
                    },
                    {
                        title: "Cuối tuần",
                        description: "Thứ 7, Chủ nhật",
                        value: 1.5,
                        deleted: false,
                        status: "active"
                    },
                    {
                        title: "Lễ tết",
                        description: "Các ngày lễ, tết",
                        value: 2.0,
                        deleted: false,
                        status: "active"
                    }
                ],
                applyTo: "service",
                status: "active",
                deleted: false,
                createdBy: {
                    account_id: "system",
                    createdAt: new Date()
                }
            },
            {
                title: "Hệ số theo độ khó",
                description: "Áp dụng hệ số theo mức độ khó của công việc",
                coefficientList: [
                    {
                        title: "Dễ",
                        description: "Công việc đơn giản",
                        value: 1.0,
                        deleted: false,
                        status: "active"
                    },
                    {
                        title: "Trung bình",
                        description: "Công việc bình thường",
                        value: 1.3,
                        deleted: false,
                        status: "active"
                    },
                    {
                        title: "Khó",
                        description: "Công việc phức tạp",
                        value: 1.6,
                        deleted: false,
                        status: "active"
                    }
                ],
                applyTo: "service",
                status: "active",
                deleted: false,
                createdBy: {
                    account_id: "system",
                    createdAt: new Date()
                }
            }
        ];
        
        const insertedCostFactorTypes = await CostFactorType.insertMany(costFactorTypes);
        console.log(`✓ Inserted ${insertedCostFactorTypes.length} cost factor types`);

        // 3. Seed Services
        console.log('3. Seeding Services...');
        const services = [
            {
                title: "Chăm sóc người cao tuổi",
                basicPrice: 150000,
                coefficient_id: insertedCostFactorTypes[0]._id.toString(),
                description: "Dịch vụ chăm sóc toàn diện cho người cao tuổi, bao gồm hỗ trợ sinh hoạt hàng ngày",
                status: "active",
                deleted: false,
                createdBy: {
                    account_id: "system",
                    createdAt: new Date()
                }
            },
            {
                title: "Chăm sóc trẻ em",
                basicPrice: 120000,
                coefficient_id: insertedCostFactorTypes[0]._id.toString(),
                description: "Dịch vụ chăm sóc trẻ em tại nhà, đảm bảo an toàn và phát triển toàn diện",
                status: "active",
                deleted: false,
                createdBy: {
                    account_id: "system",
                    createdAt: new Date()
                }
            },
            {
                title: "Chăm sóc bệnh nhân",
                basicPrice: 200000,
                coefficient_id: insertedCostFactorTypes[1]._id.toString(),
                description: "Dịch vụ chăm sóc bệnh nhân tại nhà, hỗ trợ y tế cơ bản",
                status: "active",
                deleted: false,
                createdBy: {
                    account_id: "system",
                    createdAt: new Date()
                }
            },
            {
                title: "Dọn dẹp nhà cửa",
                basicPrice: 100000,
                coefficient_id: insertedCostFactorTypes[0]._id.toString(),
                description: "Dịch vụ dọn dẹp, vệ sinh nhà cửa chuyên nghiệp",
                status: "active",
                deleted: false,
                createdBy: {
                    account_id: "system",
                    createdAt: new Date()
                }
            },
            {
                title: "Nấu ăn tại nhà",
                basicPrice: 80000,
                coefficient_id: insertedCostFactorTypes[0]._id.toString(),
                description: "Dịch vụ nấu ăn tại nhà theo yêu cầu của khách hàng",
                status: "active",
                deleted: false,
                createdBy: {
                    account_id: "system",
                    createdAt: new Date()
                }
            }
        ];
        
        const insertedServices = await Service.insertMany(services);
        console.log(`✓ Inserted ${insertedServices.length} services`);

        // 4. Seed Locations
        console.log('4. Seeding Locations...');
        const locations = [
            {
                Name: "Hà Nội",
                status: "active",
                Districts: [
                    {
                        Name: "Ba Đình",
                        Wards: [
                            { Name: "Phúc Xá" },
                            { Name: "Trúc Bạch" },
                            { Name: "Vĩnh Phúc" },
                            { Name: "Cống Vị" },
                            { Name: "Liễu Giai" }
                        ]
                    },
                    {
                        Name: "Hoàn Kiếm",
                        Wards: [
                            { Name: "Phúc Tân" },
                            { Name: "Đồng Xuân" },
                            { Name: "Hàng Mã" },
                            { Name: "Hàng Buồm" },
                            { Name: "Hàng Đào" }
                        ]
                    },
                    {
                        Name: "Cầu Giấy",
                        Wards: [
                            { Name: "Nghĩa Đô" },
                            { Name: "Nghĩa Tân" },
                            { Name: "Mai Dịch" },
                            { Name: "Dịch Vọng" },
                            { Name: "Quan Hoa" }
                        ]
                    }
                ]
            },
            {
                Name: "Hồ Chí Minh",
                status: "active",
                Districts: [
                    {
                        Name: "Quận 1",
                        Wards: [
                            { Name: "Tân Định" },
                            { Name: "Đa Kao" },
                            { Name: "Bến Nghé" },
                            { Name: "Bến Thành" },
                            { Name: "Nguyễn Thái Bình" }
                        ]
                    },
                    {
                        Name: "Quận 3",
                        Wards: [
                            { Name: "Võ Thị Sáu" },
                            { Name: "Đa Kao" },
                            { Name: "Tân Định" },
                            { Name: "Phường 1" },
                            { Name: "Phường 2" }
                        ]
                    },
                    {
                        Name: "Quận 7",
                        Wards: [
                            { Name: "Tân Thuận Đông" },
                            { Name: "Tân Thuận Tây" },
                            { Name: "Tân Kiểng" },
                            { Name: "Tân Hưng" },
                            { Name: "Bình Thuận" }
                        ]
                    }
                ]
            }
        ];
        
        const insertedLocations = await Location.insertMany(locations);
        console.log(`✓ Inserted ${insertedLocations.length} locations`);

        // 5. Seed Staff
        console.log('5. Seeding Staff...');
        const hashedPassword = await bcrypt.hash('123456', 10);
        const staffs = [
            {
                staff_id: "STAFF001",
                fullName: "Nguyễn Văn Admin",
                password: hashedPassword,
                birthDate: new Date('1990-01-01'),
                startDate: new Date(),
                phone: "0901234567",
                email: "admin@homecare.com",
                birthPlace: "Hà Nội",
                avatar: "https://example.com/avatar1.jpg",
                salary: 15000000,
                role_id: insertedRoles[0]._id.toString(), // Admin role
                status: "active",
                offDateList: [],
                deleted: false,
                createdBy: {
                    account_id: "system",
                    createdAt: new Date()
                }
            },
            {
                staff_id: "STAFF002",
                fullName: "Trần Thị Manager",
                password: hashedPassword,
                birthDate: new Date('1985-05-15'),
                startDate: new Date(),
                phone: "0901234568",
                email: "manager@homecare.com",
                birthPlace: "TP.HCM",
                avatar: "https://example.com/avatar2.jpg",
                salary: 12000000,
                role_id: insertedRoles[1]._id.toString(), // Manager role
                status: "active",
                offDateList: [],
                deleted: false,
                createdBy: {
                    account_id: "system",
                    createdAt: new Date()
                }
            },
            {
                staff_id: "STAFF003",
                fullName: "Lê Văn Staff",
                password: hashedPassword,
                birthDate: new Date('1992-08-20'),
                startDate: new Date(),
                phone: "0901234569",
                email: "staff@homecare.com",
                birthPlace: "Đà Nẵng",
                avatar: "https://example.com/avatar3.jpg",
                salary: 8000000,
                role_id: insertedRoles[2]._id.toString(), // Staff role
                status: "active",
                offDateList: [],
                deleted: false,
                createdBy: {
                    account_id: "system",
                    createdAt: new Date()
                }
            }
        ];
        
        const insertedStaffs = await Staff.insertMany(staffs);
        console.log(`✓ Inserted ${insertedStaffs.length} staff members`);

        // 6. Seed Helpers
        console.log('6. Seeding Helpers...');
        const helpers = [
            {
                helper_id: "HELPER001",
                fullName: "Nguyễn Thị Hoa",
                startDate: new Date(),
                baseFactor: 1.2,
                birthDate: new Date('1988-03-10'),
                phone: "0912345678",
                birthPlace: "Hà Nội",
                address: "123 Đường ABC, Quận Ba Đình, Hà Nội",
                jobs: ["chăm sóc người cao tuổi", "dọn dẹp nhà cửa"],
                yearOfExperience: 5,
                experienceDescription: "5 năm kinh nghiệm chăm sóc người cao tuổi và dọn dẹp nhà cửa",
                avatar: "https://example.com/helper1.jpg",
                healthCertificates: ["Giấy chứng nhận sức khỏe", "Chứng chỉ sơ cấp cứu"],
                gender: "Nữ",
                nationality: "Việt Nam",
                educationLevel: "Trung học phổ thông",
                height: 160,
                weight: 50,
                status: "online",
                password: hashedPassword,
                deleted: false,
                createdBy: {
                    account_id: "system",
                    createdAt: new Date()
                }
            },
            {
                helper_id: "HELPER002",
                fullName: "Trần Văn Nam",
                startDate: new Date(),
                baseFactor: 1.5,
                birthDate: new Date('1985-07-25'),
                phone: "0912345679",
                birthPlace: "TP.HCM",
                address: "456 Đường XYZ, Quận 1, TP.HCM",
                jobs: ["chăm sóc bệnh nhân", "hỗ trợ y tế"],
                yearOfExperience: 8,
                experienceDescription: "8 năm kinh nghiệm chăm sóc bệnh nhân và hỗ trợ y tế tại nhà",
                avatar: "https://example.com/helper2.jpg",
                healthCertificates: ["Giấy chứng nhận sức khỏe", "Chứng chỉ điều dưỡng"],
                gender: "Nam",
                nationality: "Việt Nam",
                educationLevel: "Cao đẳng",
                height: 170,
                weight: 65,
                status: "online",
                password: hashedPassword,
                deleted: false,
                createdBy: {
                    account_id: "system",
                    createdAt: new Date()
                }
            },
            {
                helper_id: "HELPER003",
                fullName: "Phạm Thị Lan",
                startDate: new Date(),
                baseFactor: 1.0,
                birthDate: new Date('1990-12-05'),
                phone: "0912345680",
                birthPlace: "Đà Nẵng",
                address: "789 Đường DEF, Quận Hải Châu, Đà Nẵng",
                jobs: ["chăm sóc trẻ em", "nấu ăn"],
                yearOfExperience: 3,
                experienceDescription: "3 năm kinh nghiệm chăm sóc trẻ em và nấu ăn gia đình",
                avatar: "https://example.com/helper3.jpg",
                healthCertificates: ["Giấy chứng nhận sức khỏe"],
                gender: "Nữ",
                nationality: "Việt Nam",
                educationLevel: "Trung học phổ thông",
                height: 155,
                weight: 48,
                status: "offline",
                password: hashedPassword,
                deleted: false,
                createdBy: {
                    account_id: "system",
                    createdAt: new Date()
                }
            }
        ];
        
        const insertedHelpers = await Helper.insertMany(helpers);
        console.log(`✓ Inserted ${insertedHelpers.length} helpers`);

        // 7. Seed Customers
        console.log('7. Seeding Customers...');
        const customers = [
            {
                fullName: "Nguyễn Văn Khách",
                phone: "0987654321",
                email: "customer1@gmail.com",
                password: hashedPassword,
                points: [
                    {
                        point: 100,
                        updateDate: new Date()
                    }
                ],
                addresses: [
                    {
                        province: "Hà Nội",
                        district: "Ba Đình",
                        ward: "Phúc Xá",
                        detailAddress: "Số 15, Ngõ 20, Đường Phúc Xá"
                    }
                ]
            },
            {
                fullName: "Trần Thị Hương",
                phone: "0987654322",
                email: "customer2@gmail.com",
                password: hashedPassword,
                points: [
                    {
                        point: 250,
                        updateDate: new Date()
                    }
                ],
                addresses: [
                    {
                        province: "Hồ Chí Minh",
                        district: "Quận 1",
                        ward: "Bến Nghé",
                        detailAddress: "Số 100, Đường Nguyễn Huệ"
                    },
                    {
                        province: "Hồ Chí Minh",
                        district: "Quận 7",
                        ward: "Tân Thuận Đông",
                        detailAddress: "Số 50, Đường Nguyễn Thị Thập"
                    }
                ]
            },
            {
                fullName: "Lê Văn Minh",
                phone: "0987654323",
                email: "customer3@gmail.com",
                password: hashedPassword,
                points: [
                    {
                        point: 75,
                        updateDate: new Date()
                    }
                ],
                addresses: [
                    {
                        province: "Hà Nội",
                        district: "Cầu Giấy",
                        ward: "Nghĩa Đô",
                        detailAddress: "Số 200, Đường Hoàng Quốc Việt"
                    }
                ]
            }
        ];
        
        const insertedCustomers = await Customer.insertMany(customers);
        console.log(`✓ Inserted ${insertedCustomers.length} customers`);

        // 8. Seed Blogs
        console.log('8. Seeding Blogs...');
        const blogs = [
            {
                title: "5 Lưu Ý Quan Trọng Khi Chăm Sóc Người Cao Tuổi Tại Nhà",
                description: "Hướng dẫn chi tiết các lưu ý cần thiết khi chăm sóc người cao tuổi tại nhà để đảm bảo sức khỏe và an toàn",
                img: "https://example.com/blog1.jpg",
                desc_img: "Hình ảnh chăm sóc người cao tuổi",
                content: "Nội dung blog chi tiết về cách chăm sóc người cao tuổi...",
                author: "Bs. Nguyễn Văn A",
                type: "Hướng dẫn chăm sóc",
                date: new Date(),
                status: "published",
                deleted: false,
                createdBy: {
                    account_id: insertedStaffs[0]._id.toString(),
                    createdAt: new Date()
                }
            },
            {
                title: "Dịch Vụ Chăm Sóc Trẻ Em Chuyên Nghiệp - An Toàn Tuyệt Đối",
                description: "Giới thiệu về dịch vụ chăm sóc trẻ em với đội ngũ chuyên nghiệp và quy trình an toàn",
                img: "https://example.com/blog2.jpg",
                desc_img: "Hình ảnh chăm sóc trẻ em",
                content: "Nội dung blog về dịch vụ chăm sóc trẻ em...",
                author: "Ts. Trần Thị B",
                type: "Quảng cáo dịch vụ",
                date: new Date(),
                status: "published",
                deleted: false,
                createdBy: {
                    account_id: insertedStaffs[1]._id.toString(),
                    createdAt: new Date()
                }
            },
            {
                title: "Thông Báo Cập Nhật Chính Sách Dịch Vụ Tháng 9/2025",
                description: "Thông báo về các thay đổi trong chính sách dịch vụ có hiệu lực từ tháng 9/2025",
                img: "https://example.com/blog3.jpg",
                desc_img: "Thông báo chính sách",
                content: "Nội dung thông báo cập nhật chính sách...",
                author: "Ban Quản Lý",
                type: "Thông báo chính sách",
                date: new Date(),
                status: "published",
                deleted: false,
                createdBy: {
                    account_id: insertedStaffs[0]._id.toString(),
                    createdAt: new Date()
                }
            }
        ];
        
        const insertedBlogs = await Blog.insertMany(blogs);
        console.log(`✓ Inserted ${insertedBlogs.length} blogs`);

        // 9. Seed Policies
        console.log('9. Seeding Policies...');
        const policies = [
            {
                title: "Chính sách bảo mật thông tin khách hàng",
                content: "Công ty cam kết bảo mật tuyệt đối thông tin cá nhân của khách hàng. Mọi thông tin sẽ được mã hóa và bảo vệ theo tiêu chuẩn quốc tế...",
                date: new Date(),
                status: "active",
                deleted: false,
                createdBy: {
                    account_id: insertedStaffs[0]._id.toString(),
                    createdAt: new Date()
                }
            },
            {
                title: "Quy định về hoàn tiền và hủy dịch vụ",
                content: "Khách hàng có thể hủy dịch vụ trước 2 giờ mà không mất phí. Trường hợp hủy muộn hơn sẽ tính phí theo quy định...",
                date: new Date(),
                status: "active",
                deleted: false,
                createdBy: {
                    account_id: insertedStaffs[1]._id.toString(),
                    createdAt: new Date()
                }
            },
            {
                title: "Điều khoản sử dụng dịch vụ",
                content: "Bằng việc sử dụng dịch vụ, khách hàng đồng ý tuân thủ các điều khoản và điều kiện được quy định...",
                date: new Date(),
                status: "active",
                deleted: false,
                createdBy: {
                    account_id: insertedStaffs[0]._id.toString(),
                    createdAt: new Date()
                }
            }
        ];
        
        const insertedPolicies = await Policy.insertMany(policies);
        console.log(`✓ Inserted ${insertedPolicies.length} policies`);

        // 10. Seed Questions (FAQ)
        console.log('10. Seeding Questions (FAQ)...');
        const questions = [
            {
                question: "Làm thế nào để đặt dịch vụ chăm sóc tại nhà?",
                answer: "Bạn có thể đặt dịch vụ thông qua ứng dụng di động hoặc website. Chọn loại dịch vụ, thời gian và địa điểm, sau đó xác nhận đặt lịch.",
                date: new Date(),
                status: "active",
                deleted: false,
                createdBy: {
                    account_id: insertedStaffs[2]._id.toString(),
                    createdAt: new Date()
                }
            },
            {
                question: "Chi phí dịch vụ được tính như thế nào?",
                answer: "Chi phí được tính dựa trên giá cơ bản của từng dịch vụ nhân với các hệ số theo thời gian và độ khó của công việc.",
                date: new Date(),
                status: "active",
                deleted: false,
                createdBy: {
                    account_id: insertedStaffs[2]._id.toString(),
                    createdAt: new Date()
                }
            },
            {
                question: "Tôi có thể hủy dịch vụ sau khi đã đặt không?",
                answer: "Có, bạn có thể hủy dịch vụ trước 2 giờ so với thời gian bắt đầu mà không mất phí. Hủy muộn hơn sẽ tính phí theo quy định.",
                date: new Date(),
                status: "active",
                deleted: false,
                createdBy: {
                    account_id: insertedStaffs[1]._id.toString(),
                    createdAt: new Date()
                }
            },
            {
                question: "Làm sao để trở thành helper của công ty?",
                answer: "Bạn cần điền đơn ứng tuyển, cung cấp các giấy tờ cần thiết như chứng minh nhân dân, giấy khám sức khỏe, và tham gia khóa đào tạo của công ty.",
                date: new Date(),
                status: "active",
                deleted: false,
                createdBy: {
                    account_id: insertedStaffs[1]._id.toString(),
                    createdAt: new Date()
                }
            },
            {
                question: "Công ty có bảo hiểm cho helper không?",
                answer: "Có, tất cả helper đều được mua bảo hiểm tai nạn và bảo hiểm trách nhiệm nghề nghiệp để đảm bảo quyền lợi cho cả helper và khách hàng.",
                date: new Date(),
                status: "active",
                deleted: false,
                createdBy: {
                    account_id: insertedStaffs[0]._id.toString(),
                    createdAt: new Date()
                }
            }
        ];
        
        const insertedQuestions = await Question.insertMany(questions);
        console.log(`✓ Inserted ${insertedQuestions.length} questions`);

        // 11. Seed Device Tokens
        console.log('11. Seeding Device Tokens...');
        const deviceTokens = [
            {
                userId: insertedCustomers[0]._id,
                phone: insertedCustomers[0].phone,
                token: "dA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6",
                platform: "android",
                topics: ["general", "promotions"],
                lastSeenAt: new Date()
            },
            {
                userId: insertedCustomers[1]._id,
                phone: insertedCustomers[1].phone,
                token: "eB2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A1",
                platform: "ios",
                topics: ["general", "service_updates"],
                lastSeenAt: new Date()
            },
            {
                userId: insertedCustomers[2]._id,
                phone: insertedCustomers[2].phone,
                token: "fC3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A1B2",
                platform: "android",
                topics: ["general"],
                lastSeenAt: new Date()
            },
            {
                phone: "0999888777",
                token: "gD4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A1B2C3",
                platform: "web",
                topics: ["general", "news"],
                lastSeenAt: new Date()
            }
        ];
        
        const insertedDeviceTokens = await DeviceToken.insertMany(deviceTokens);
        console.log(`✓ Inserted ${insertedDeviceTokens.length} device tokens`);

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('='.repeat(50));
        console.log('Summary:');
        console.log(`✓ Roles: ${insertedRoles.length}`);
        console.log(`✓ Cost Factor Types: ${insertedCostFactorTypes.length}`);
        console.log(`✓ Services: ${insertedServices.length}`);
        console.log(`✓ Locations: ${insertedLocations.length}`);
        console.log(`✓ Staff: ${insertedStaffs.length}`);
        console.log(`✓ Helpers: ${insertedHelpers.length}`);
        console.log(`✓ Customers: ${insertedCustomers.length}`);
        console.log(`✓ Blogs: ${insertedBlogs.length}`);
        console.log(`✓ Policies: ${insertedPolicies.length}`);
        console.log(`✓ Questions: ${insertedQuestions.length}`);
        console.log(`✓ Device Tokens: ${insertedDeviceTokens.length}`);
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

async function runSeed() {
    await seedDatabase();
}

// Run the seed function if this file is executed directly
if (require.main === module) {
    runSeed();
}

module.exports = seedDatabase;
