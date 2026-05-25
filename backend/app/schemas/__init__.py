from .action_corrective import (
    ActionCorrectiveBase,
    ActionCorrectiveCreate,
    ActionCorrectiveResponse,
    ActionCorrectiveUpdate,
)
from .analyse_ecart import (
    AnalyseEcartBase,
    AnalyseEcartCreate,
    AnalyseEcartDetailResponse,
    AnalyseEcartResponse,
    AnalyseEcartSimpleResponse,
    AnalyseEcartUpdate,
)
from .budget import (
    BudgetBase,
    BudgetCreate,
    BudgetDetailResponse,
    BudgetResponse,
    BudgetSimpleResponse,
    BudgetUpdate,
)
from .categorie_budgetaire import (
    CategorieBudgetaireBase,
    CategorieBudgetaireCreate,
    CategorieBudgetaireResponse,
    CategorieBudgetaireUpdate,
)
from .departement import (
    DepartementBase,
    DepartementCreate,
    DepartementResponse,
    DepartementUpdate,
)
from .ecart_budgetaire import (
    EcartBudgetaireBase,
    EcartBudgetaireCreate,
    EcartBudgetaireDetailResponse,
    EcartBudgetaireResponse,
    EcartBudgetaireSimpleResponse,
    EcartBudgetaireUpdate,
)
from .exercice_budgetaire import (
    ExerciceBudgetaireBase,
    ExerciceBudgetaireCreate,
    ExerciceBudgetaireResponse,
    ExerciceBudgetaireUpdate,
)
from .ligne_budgetaire import (
    LigneBudgetaireBase,
    LigneBudgetaireCreate,
    LigneBudgetaireDetailResponse,
    LigneBudgetaireResponse,
    LigneBudgetaireSimpleResponse,
    LigneBudgetaireUpdate,
)
from .notification import (
    NotificationBase,
    NotificationCreate,
    NotificationResponse,
    NotificationUpdate,
)
from .permission import (
    PermissionBase,
    PermissionCreate,
    PermissionResponse,
    PermissionSimpleResponse,
    PermissionUpdate,
)
from .prevision import (
    PrevisionBase,
    PrevisionCreate,
    PrevisionResponse,
    PrevisionUpdate,
)
from .rapport_budgetaire import (
    RapportBudgetaireBase,
    RapportBudgetaireCreate,
    RapportBudgetaireResponse,
    RapportBudgetaireUpdate,
)
from .realisation import (
    RealisationBase,
    RealisationCreate,
    RealisationResponse,
    RealisationUpdate,
)
from .role import (
    RoleBase,
    RoleCreate,
    RoleResponse,
    RoleSimpleResponse,
    RoleUpdate,
)
from .user import (
    UserBase,
    UserCreate,
    UserResponse,
    UserSimpleResponse,
    UserUpdate,
)
from .validation_budget import (
    ValidationBudgetBase,
    ValidationBudgetCreate,
    ValidationBudgetResponse,
    ValidationBudgetUpdate,
)

from .budget import BudgetSimpleResponse
from .departement import DepartementDetailResponse
from .projet import ProjetDetailResponse, ProjetResponse, ProjetSimpleResponse
from .user import UserResponse

ProjetDetailResponse.model_rebuild(_types_namespace={"BudgetSimpleResponse": BudgetSimpleResponse})
ProjetResponse.model_rebuild()
BudgetResponse.model_rebuild()
BudgetDetailResponse.model_rebuild()
DepartementDetailResponse.model_rebuild(
    _types_namespace={
        "ProjetSimpleResponse": ProjetSimpleResponse,
        "UserSimpleResponse": UserSimpleResponse,
    }
)
UserResponse.model_rebuild()
