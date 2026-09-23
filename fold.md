campussafar-crm
├── crm-frontend/
│   ├── node_modules 
│   ├── src 
│   │   ├── assets/ 
│   │   │   ├── branding/ 
│   │   │   │   └──logo.svg 
│   │   │   └── illustrations/  
│   │   ├── components/ 
│   │   │   ├── ui/         
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── OnlineDot.jsx
│   │   │   │   └── StateCitySelect.jsx                  
│   │   │   ├── layout/         
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── AuthLayout.jsx
│   │   │   │   ├── Topbar.jsx
│   │   │   │   └── ProtectedRoute.jsx           
│   │   │   ├── leads/         
│   │   │   │   ├── DealForm.jsx
│   │   │   │   ├── DynamicFieldInput.jsx
│   │   │   │   ├── LeadCard.jsx
│   │   │   │   ├── LeadForm.jsx
│   │   │   │   ├── LeadTable.jsx
│   │   │   │   ├── MergeDuplicatesModal.jsx
│   │   │   │   └── ViewerBanner.jsx              
│   │   │   ├── interactions/         
│   │   │   │   ├── CallLogForm.jsx
│   │   │   │   ├── Timeline.jsx
│   │   │   │   └── VisitLogForm.jsx      
│   │   │   ├── calendar/         
│   │   │   │   ├── DayCell.jsx
│   │   │   │   ├── StreakHeatmap.jsx
│   │   │   │   └── TaskCalendar.jsx
│   │   │   ├── map/         
│   │   │   │   ├── MapView.jsx
│   │   │   │   ├── MapFilters.jsx
│   │   │   │   └── CityDrilldown.jsx              
│   │   │   ├── dashboard/         
│   │   │   │   ├── FunnelChart.jsx
│   │   │   │   ├── Leaderboard.jsx
│   │   │   │   └── StatCard.jsx         
│   │   │   ├── kanban/         
│   │   │   │   ├── KanbanBoard.jsx
│   │   │   │   ├── KanbanColumn.jsx
│   │   │   │   └── KanbanCard.jsx             
│   │   │   ├── team/         
│   │   │   │   ├── AddMemberModal.jsx
│   │   │   │   ├── MemberCard.jsx
│   │   │   │   ├── TargetEditor.jsx
│   │   │   │   ├── TeamTree.jsx
│   │   │   │   └── TerritoryAssign.jsx                
│   │   │   ├── fraud/         
│   │   │   │   ├── FraudFlagCard.jsx
│   │   │   │   ├── ReviewPanel.jsx
│   │   │   │   └── TrustBadge.jsx              
│   │   │   ├── import/         
│   │   │   │   ├── ColumnMapper.jsx
│   │   │   │   ├── DupeReview.jsx
│   │   │   │   └── Uploader.jsx            
│   │   │   └── categories/ 
│   │   │       ├── CategoryBuilder.jsx
│   │   │       └── CustomFieldEditor.jsx      
│   │   ├── pages/ 
│   │   │   ├── auth/  
│   │   │   │   ├── AdminLoginPage.jsx
│   │   │       └── LoginPage.jsx          
│   │   │   ├── dashboard/  
│   │   │   │   ├── BdeDashboardPage.jsx
│   │   │   │   ├── FounderDashboard.jsx
│   │   │   │   └── TeamLeadDashboard.jsx        
│   │   │   │                     
│   │   │   ├── leads/   
│   │   │   │   ├── KanbanPage.jsx
│   │   │   │   ├── LeadProfilePage.jsx
│   │   │   │   └── LeadsListPage.jsx       
│   │   │   ├── calendar/ 
│   │   │   │   ├── MyCalendarPage.jsx
│   │   │   │   └── TeamCalendarPage.jsx          
│   │   │   ├── map/  
│   │   │   │   └── MapViewPage.jsx             
│   │   │   ├── team/      
│   │   │   │   ├── MemberProfile.jsx
│   │   │   │   └── TeamManagementPage.jsx        # ,  
│   │   │   ├── import/    
│   │   │   │   └── ImportDataPage.jsx      
│   │   │   ├── reports/  
│   │   │   │   └── ReportsPage.jsx         
│   │   │   ├── fraud/       
│   │   │   │   └── FraudReviewPage.jsx  
│   │   │   ├── settings/    
│   │   │   │   ├── CategoryBuilderPage.jsx
│   │   │   │   └── SettingsPage.jsx    
│   │   │   └── NotFoundPage.jsx 
│   │   ├── hooks/   
│   │   │   ├── useAuth.js
│   │   │   ├── useDebounce.js
│   │   │   ├── usePresence.js
│   │   │   ├── useRole.js
│   │   │   ├── useUI.js
│   │   │   └── useSocket.jsx              
│   │   ├── context/           
│   │   │   ├── AuthContext.jsx
│   │   │   ├── PresenceContext.jsx
│   │   │   ├── RoleContext.jsx
│   │   │   ├── SocketContext.jsx
│   │   │   └── UIContext.jsx                 
│   │   ├── lib/ 
│   │   │   ├── api/ 
│   │   │   │   ├── axiosInstance.js
│   │   │   │   └── endpoint.js            
│   │   │   ├── socket/           
│   │   │   │   └── socketClient.js            
│   │   │   └── utils/     
│   │   │       ├── dateHelpers.js
│   │   │       ├── exportHelpers.js
│   │   │       ├── fileHelpers.js
│   │   │       ├── fraudHelpers.js
│   │   │       └── streakHelpers.js          
│   │   ├── store/     
│   │   │   ├── calendarSlice.js
│   │   │   ├── leadSlice.js
│   │   │   └── userSlice.js     
│   │   ├── routes/    
│   │   │   ├── AppRoutes.jsx
│   │   │   └── roleBasedRoutes.js        
│   │   ├── App.jsx 
│   │   ├── index.css 
│   │   └── main.jsx 
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.js
│   ├── tailwind.config.js
│   └──  vite.config.js
├──crm-backend/ 
│   ├── node_modules
│   ├── scripts/
│   │   └── seedAdmin.js
│   ├── src/ 
│   │   ├── config/ 
│   │   │   ├── db.js                
│   │   │   ├── socket.js            
│   │   │   └── env.js               
│   │   ├── data/ 
│   │   │   └── india.json               
│   │   ├── models/ 
│   │   │   ├── User.js 
│   │   │   ├── Team.js 
│   │   │   ├── Category.js 
│   │   │   ├── Lead.js 
│   │   │   ├── Interaction.js 
│   │   │   ├── Deal.js 
│   │   │   ├── FraudFlag.js 
│   │   │   ├── AuditLog.js 
│   │   │   └── StateCity.js 
│   │   ├── controllers/ 
│   │   │   ├── auth.controller.js 
│   │   │   ├── user.controller.js 
│   │   │   ├── lead.controller.js 
│   │   │   ├── interaction.controller.js 
│   │   │   ├── calendar.controller.js 
│   │   │   ├── category.controller.js 
│   │   │   ├── import.controller.js 
│   │   │   ├── dashboard.controller.js 
│   │   │   ├── fraud.controller.js 
│   │   │   └── map.controller.js 
│   │   │   └── deal.controller.js 
│   │   ├── routes/
│   │   │   ├── auth.routes.js 
│   │   │   ├── user.routes.js 
│   │   │   ├── lead.routes.js 
│   │   │   ├── interaction.routes.js 
│   │   │   ├── calendar.routes.js 
│   │   │   ├── category.routes.js 
│   │   │   ├── import.routes.js 
│   │   │   ├── dashboard.routes.js 
│   │   │   ├── fraud.routes.js 
│   │   │   └── map.routes.js 
│   │   │   └── meta.routes.js 
│   │   │   └── deal.routes.js                   
│   │   ├── scripts/ 
│   │   │   ├── backfillFollowUpOwner.js       
│   │   │   ├── backfillLeadStates.js       
│   │   │   ├── clearUncalledFollowUps.js       
│   │   │   ├── fraudCleanup.js       
│   │   │   └── seedStatesCities.js 
│   │   ├── middlewares/ 
│   │   │   ├── auth.middleware.js       
│   │   │   ├── role.middleware.js        
│   │   │   ├── territory.middleware.js   
│   │   │   ├── auditLogger.middleware.js 
│   │   │   ├── upload.middleware.js 
│   │   │   └── errorHandler.middleware.js 
│   │   ├── services/ 
│   │   │   ├── fraudDetection.service.js   
│   │   │   ├── dedupe.service.js           
│   │   │   ├── aggregation.service.js      
│   │   │   ├── importParser.service.js     
│   │   │   ├── followUp.service.js    
│   │   │   ├── stateResolver.service.js    
│   │   │   ├── trustResolver.service.js    
│   │   │   └── export.service.js           
│   │   ├── sockets/ 
│   │   │   ├── socketHandlers.js       
│   │   │   ├── leadEvents.js            
│   │   │   ├── roomResolver.js            
│   │   │   └── presenceEvents.js       
│   │   ├── jobs/ 
│   │   │   ├── staleLeadChecker.job.js      
│   │   │   └── dailyAggregation.job.js     
│   │   ├── validators/ 
│   │   │   ├── lead.validator.js 
│   │   │   └── interaction.validator.js 
│   │   ├── utils/ 
│   │   │   ├── apiResponse.js      
│   │   │   ├── csvParser.js      
│   │   │   ├── leadScope.js      
│   │   │   └── logger.js  
│   │   │    
│   │   ├── app.js                    
│   │   └── server.js
│   ├── uploads/             
│   │   └── .gitkeep
│   ├── .env 
│   ├── .env.example 
│   ├── .gitignore 
│   ├── .package-lock.json 
│   └── .package.json 
└── fold.md