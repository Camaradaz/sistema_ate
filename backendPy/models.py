from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Sector(db.Model):
    __tablename__ = 'sectors'
    sector_id = db.Column(db.Integer, primary_key=True)
    sector_name = db.Column(db.String(50), nullable=False, unique=True)
    sector_code = db.Column(db.String(12), nullable=False, unique=True)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    
    def to_dict(self):
        return {
            'id': self.sector_id,
            'name': self.sector_name,
            'code': self.sector_code
        }

class Affiliate(db.Model):
    __tablename__ = 'affiliates'
    
    id_associate = db.Column(db.Integer, primary_key=True)
    affiliate_code = db.Column(db.Integer, unique=True)
    affiliate_name = db.Column(db.String(200), nullable=False)
    dni = db.Column(db.String(20), nullable=False, unique=True)
    gender = db.Column(db.String(1), nullable=False)
    contact = db.Column(db.String(100))
    sector_id = db.Column(db.Integer, db.ForeignKey('sectors.sector_id'))
    has_children = db.Column(db.Boolean, default=False)
    has_disability = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    def to_dict(self):
        return {
            'id_associate': self.id_associate,
            'affiliate_code': self.affiliate_code,
            'affiliate_name': self.affiliate_name,
            'dni': self.dni,
            'gender': self.gender,
            'contact': self.contact,
            'sector_id': self.sector_id,
            'has_children': self.has_children,
            'has_disability': self.has_disability,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Child(db.Model):
    __tablename__ = 'children'
    
    child_id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    birth_date = db.Column(db.Date)
    dni = db.Column(db.String(20))
    affiliate_id = db.Column(db.Integer, db.ForeignKey('affiliates.id_associate'))

    def to_dict(self):
        return {
            'child_id': self.child_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'dni': self.dni,
            'affiliate_id': self.affiliate_id
        }

class Delegate(db.Model):
    __tablename__ = 'delegates'
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    dni = db.Column(db.String(20))
    sector_id = db.Column(db.Integer, db.ForeignKey('sectors.sector_id'))
    is_active = db.Column(db.Boolean, default=True)
    status = db.Column(db.String(50), default='Activo')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'dni': self.dni,
            'sector_id': self.sector_id,
            'is_active': self.is_active,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    last_login = db.Column(db.DateTime(timezone=True))

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class Benefit(db.Model):
    __tablename__ = 'benefits'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    age_range = db.Column(db.String(50))
    stock = db.Column(db.Integer, default=0)
    status = db.Column(db.String(50), default='Disponible')
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Benefit {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'age_range': self.age_range,
            'stock': self.stock,
            'status': self.status,
            'is_available': self.is_available,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Event(db.Model):
    __tablename__ = 'events'
    
    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(50), nullable=False)
    category = db.Column(db.String(50))
    description = db.Column(db.Text)
    date = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    user = db.Column(db.String(50))
    entity_id = db.Column(db.Integer)
    path = db.Column(db.String(255))

    def to_dict(self):
        return {
            'id': self.id,
            'event_type': self.event_type,
            'category': self.category,
            'description': self.description,
            'date': self.date.isoformat() if self.date else None,
            'user': self.user,
            'entity_id': self.entity_id,
            'path': self.path
        }

class DelegateAssignment(db.Model):
    __tablename__ = 'delegate_assignments'

    id = db.Column(db.Integer, primary_key=True)
    benefit_id = db.Column(db.Integer, db.ForeignKey('benefits.id'))
    delegate_id = db.Column(db.Integer, db.ForeignKey('delegates.id'))
    quantity = db.Column(db.Integer, nullable=False)
    assignment_date = db.Column(db.DateTime, default=db.func.current_timestamp())

    # Relaciones
    benefit = db.relationship('Benefit', backref='assignments')
    delegate = db.relationship('Delegate', backref='assignments')

    def to_dict(self):
        return {
            'id': self.id,
            'benefit_id': self.benefit_id,
            'delegate_id': self.delegate_id,
            'quantity': self.quantity,
            'assignment_date': self.assignment_date.isoformat() if self.assignment_date else None,
            'delegate_name': f"{self.delegate.first_name} {self.delegate.last_name}" if self.delegate else None,
            'benefit_name': self.benefit.name if self.benefit else None
        }

class BenefitDelivery(db.Model):
    __tablename__ = 'benefit_deliveries'

    delivery_id = db.Column(db.Integer, primary_key=True)
    delegate_id = db.Column(db.Integer, db.ForeignKey('delegates.id'))
    affiliate_id = db.Column(db.Integer, db.ForeignKey('affiliates.id_associate'))
    benefit_id = db.Column(db.Integer, db.ForeignKey('benefits.id'))
    child_id = db.Column(db.Integer, db.ForeignKey('children.child_id'))
    quantity = db.Column(db.Integer, default=1, nullable=False)
    delivery_date = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    notes = db.Column(db.Text)
    status = db.Column(db.String(50), default='Entregado')
    recipient_type = db.Column(db.String(50))

    def to_dict(self):
        return {
            'delivery_id': self.delivery_id,
            'delegate_id': self.delegate_id,
            'affiliate_id': self.affiliate_id,
            'benefit_id': self.benefit_id,
            'child_id': self.child_id,
            'quantity': self.quantity,
            'delivery_date': self.delivery_date.isoformat() if self.delivery_date else None,
            'notes': self.notes,
            'status': self.status,
            'recipient_type': self.recipient_type
        }
