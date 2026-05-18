from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.categorie_budgetaire import CategorieBudgetaire
from app.models.departement import Departement
from app.models.permission import Permission
from app.models.role import Role
from app.models.user import User
from app.security.password import hash_password


ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "Admin12345"
MANAGER_EMAIL = "gestionnaire.finance@example.com"
MANAGER_PASSWORD = "Gestionnaire123"

PERMISSIONS = [
    ("users:create", "Creer des utilisateurs"),
    ("users:read", "Lire les utilisateurs"),
    ("users:update", "Modifier les utilisateurs"),
    ("users:delete", "Supprimer les utilisateurs"),
    ("roles:create", "Creer des roles"),
    ("roles:read", "Lire les roles"),
    ("roles:update", "Modifier les roles"),
    ("roles:delete", "Supprimer les roles"),
    ("permissions:read", "Lire les permissions"),
    ("permissions:update", "Modifier les permissions"),
    ("departements:create", "Creer des departements"),
    ("departements:read", "Lire les departements"),
    ("departements:update", "Modifier les departements"),
    ("departements:delete", "Supprimer les departements"),
    ("exercices:create", "Creer des exercices budgetaires"),
    ("exercices:read", "Lire les exercices budgetaires"),
    ("exercices:update", "Modifier les exercices budgetaires"),
    ("exercices:delete", "Supprimer les exercices budgetaires"),
    ("budgets:create", "Creer des budgets"),
    ("budgets:validate", "Valider des budgets"),
    ("reports:generate", "Generer des rapports"),
]

CATEGORIES = [
    ("Subventions", "recette", "Subventions et dotations recues"),
    ("Recettes propres", "recette", "Recettes generees par le departement"),
    ("Fonctionnement", "depense", "Depenses de fonctionnement courant"),
    ("Investissement", "depense", "Depenses d'investissement"),
]


def get_or_create_permissions(db: Session) -> list[Permission]:
    permissions: list[Permission] = []
    for code, description in PERMISSIONS:
      permission = db.query(Permission).filter(Permission.code == code).first()
      if permission is None:
          permission = Permission(code=code, description=description)
          db.add(permission)
      permissions.append(permission)
    db.flush()
    return permissions


def seed_admin(db: Session) -> None:
    permissions = get_or_create_permissions(db)
    admin_role = db.query(Role).filter(Role.nom_role == "Administrateur").first()
    if admin_role is None:
        admin_role = Role(
            nom_role="Administrateur",
            description="Acces complet a l'administration de l'application",
        )
        db.add(admin_role)
        db.flush()
    admin_role.permissions = permissions

    admin = db.query(User).filter(User.email == ADMIN_EMAIL).first()
    if admin is None:
        admin = User(
            nom="Admin",
            prenom="System",
            email=ADMIN_EMAIL,
            mot_de_passe=hash_password(ADMIN_PASSWORD),
            statut="actif",
        )
        db.add(admin)
        db.flush()
    else:
        admin.nom = admin.nom or "Admin"
        admin.prenom = admin.prenom or "System"
        admin.statut = "actif"
        admin.mot_de_passe = hash_password(ADMIN_PASSWORD)

    if admin_role not in admin.roles:
        admin.roles.append(admin_role)

    manager_role = db.query(Role).filter(Role.nom_role == "Gestionnaire Budgetaire").first()
    if manager_role is None:
        manager_role = Role(
            nom_role="Gestionnaire Budgetaire",
            description="Creation et soumission des budgets departementaux",
        )
        db.add(manager_role)
        db.flush()

    finance = db.query(Departement).filter(Departement.nom == "Finance").first()
    if finance is None:
        finance = Departement(
            nom="Finance",
            description="Departement finance",
            responsable="Gestionnaire Finance",
            statut="actif",
        )
        db.add(finance)
        db.flush()

    manager = db.query(User).filter(User.email == MANAGER_EMAIL).first()
    if manager is None:
        manager = User(
            nom="Gestionnaire",
            prenom="Finance",
            email=MANAGER_EMAIL,
            mot_de_passe=hash_password(MANAGER_PASSWORD),
            statut="actif",
        )
        db.add(manager)
        db.flush()
    else:
        manager.nom = manager.nom or "Gestionnaire"
        manager.prenom = manager.prenom or "Finance"
        manager.statut = "actif"
        manager.mot_de_passe = hash_password(MANAGER_PASSWORD)

    if manager_role not in manager.roles:
        manager.roles.append(manager_role)

    for nom, type_categorie, description in CATEGORIES:
        category = db.query(CategorieBudgetaire).filter(CategorieBudgetaire.nom == nom).first()
        if category is None:
            db.add(CategorieBudgetaire(nom=nom, type_categorie=type_categorie, description=description))
        else:
            category.type_categorie = type_categorie
            category.description = description

    db.commit()


def main() -> None:
    db = SessionLocal()
    try:
        seed_admin(db)
        print(f"Admin cree ou mis a jour: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print(f"Gestionnaire cree ou mis a jour: {MANAGER_EMAIL} / {MANAGER_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
