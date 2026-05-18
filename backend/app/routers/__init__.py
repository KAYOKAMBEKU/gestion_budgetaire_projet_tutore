from fastapi import APIRouter

from app.routers import auth
from app.routers import actions_correctives
from app.routers import analyses_ecarts
from app.routers import budgets
from app.routers import categories_budgetaires
from app.routers import departements
from app.routers import ecarts_budgetaires
from app.routers import exercices_budgetaires
from app.routers import lignes_budgetaires
from app.routers import notifications
from app.routers import permissions
from app.routers import previsions
from app.routers import rapports_budgetaires
from app.routers import realisations
from app.routers import roles
from app.routers import users
from app.routers import validations_budgetaires

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(roles.router)
api_router.include_router(permissions.router)
api_router.include_router(departements.router)
api_router.include_router(exercices_budgetaires.router)
api_router.include_router(categories_budgetaires.router)
api_router.include_router(budgets.router)
api_router.include_router(lignes_budgetaires.router)
api_router.include_router(previsions.router)
api_router.include_router(realisations.router)
api_router.include_router(ecarts_budgetaires.router)
api_router.include_router(analyses_ecarts.router)
api_router.include_router(actions_correctives.router)
api_router.include_router(validations_budgetaires.router)
api_router.include_router(rapports_budgetaires.router)
api_router.include_router(notifications.router)
